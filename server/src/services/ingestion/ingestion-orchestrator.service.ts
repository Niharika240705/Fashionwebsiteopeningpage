import { IngestionRun } from '../../models/IngestionRun.model';
import { Source } from '../../models/Source.model';
import { getSourceAdapter } from '../../sources/registry';
import { normalizeRawProduct } from './normalization.service';
import { upsertProductAndOffer } from './offer-upsert.service';
import { assertSourceMayIngest, getEnabledSource } from './compliance-policy.service';
import {
  Audience,
  getAllAudiences,
  getCategoriesForAudience,
  isMvpCategory,
  normalizeAudience,
} from './taxonomy.service';
import { ImageProcessingService } from '../image-processing.service';
import { SourceFetchOptions } from '../../sources/types';

export class IngestionOrchestratorService {
  private imageService = new ImageProcessingService();

  async ingestSource(
    sourceId: string,
    options?: SourceFetchOptions & { processImages?: boolean }
  ) {
    const source = await getEnabledSource(sourceId);
    const adapter = getSourceAdapter(sourceId);
    if (!adapter) {
      throw new Error(`No adapter registered for source ${sourceId}`);
    }

    assertSourceMayIngest(source, adapter.mode);

    const run = await IngestionRun.create({
      sourceId,
      mode: adapter.mode,
      status: 'running',
      startedAt: new Date(),
      policyVersion: source.policyVersion,
      counts: {
        fetched: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        imagesQueued: 0,
      },
    });

    try {
      const { products, checkpoint } = await adapter.fetchProducts({
        limit: options?.limit,
        audience: options?.audience,
        category: options?.category,
        checkpoint: options?.checkpoint,
      });
      run.counts.fetched = products.length;
      run.checkpoint = checkpoint;

      for (const raw of products) {
        try {
          const normalized = normalizeRawProduct(raw, sourceId);
          const audience = normalizeAudience(normalized.audience);
          if (!isMvpCategory(audience, normalized.category)) {
            run.counts.skipped += 1;
            continue;
          }

          const result = await upsertProductAndOffer(normalized, sourceId, source.name);
          if (result.created) run.counts.created += 1;
          if (result.updated) run.counts.updated += 1;
          run.counts.imagesQueued += result.imagesQueued;

          if (options?.processImages) {
            await this.imageService.processPendingForProduct(String(result.product._id), source);
          }
        } catch (error: any) {
          run.counts.failed += 1;
          run.errorSummary = error?.message || 'Item failed';
        }
      }

      run.status = run.counts.failed > 0 ? 'partial' : 'completed';
      run.finishedAt = new Date();
      await run.save();

      source.lastSyncedAt = new Date();
      await source.save();

      return run;
    } catch (error: any) {
      run.status = 'failed';
      run.errorSummary = error?.message || 'Ingestion failed';
      run.finishedAt = new Date();
      await run.save();
      throw error;
    }
  }

  async ingestEnabledRetailers(options?: {
    limit?: number;
    processImages?: boolean;
    sources?: string[];
  }) {
    await this.ensureSeedSources();
    const scrapeSources = ['myntra', 'hm', 'zara'].filter((id) => {
      if (id === 'myntra') return process.env.ENABLE_MYNTRA_SCRAPE === 'true';
      if (id === 'hm') return process.env.ENABLE_HM_SCRAPE === 'true';
      if (id === 'zara') return process.env.ENABLE_ZARA_SCRAPE === 'true';
      return false;
    });

    const defaultSource = process.env.CRON_INGEST_SOURCE || 'demo-affiliate';
    const wanted = options?.sources?.length
      ? options.sources
      : scrapeSources.length
        ? scrapeSources
        : [defaultSource];

    const runs = [];
    for (const sourceId of wanted) {
      const source = await Source.findOne({ sourceId });
      if (!source?.enabled) {
        console.warn(`Skipping disabled source: ${sourceId}`);
        continue;
      }
      console.log(`\n▶ Ingesting ${sourceId}...`);
      const run = await this.ingestSource(sourceId, {
        limit: options?.limit,
        processImages: options?.processImages,
      });
      runs.push(run);
      console.log(`✔ ${sourceId}:`, run.counts);
    }
    return runs;
  }

  async ensureSeedSources(): Promise<void> {
    const allCategories = Array.from(
      new Set(getAllAudiences().flatMap((audience) => getCategoriesForAudience(audience)))
    );
    const audiences = getAllAudiences() as Audience[];

    const seeds = [
      {
        sourceId: 'demo-affiliate',
        name: 'Partner Retail Catalog',
        domain: 'myntra.com',
        mode: 'affiliate_feed',
        enabled: process.env.ENABLE_DEMO_FEED !== 'false',
        audiences,
        categories: allCategories,
        attributionText: 'Sold by partner retailers (Myntra, H&M, Zara)',
        allowsImageTransform: true,
        allowsScraping: false,
        allowedDestinationHosts: [
          'example-retailer.com',
          'myntra.com',
          'www.myntra.com',
          'hm.com',
          'www.hm.com',
          'www2.hm.com',
          'zara.com',
          'www.zara.com',
        ],
        affiliateConfig: {
          network: 'demo',
          trackingParam: 'aff',
          subIdParam: 'subid',
        },
      },
      {
        sourceId: 'myntra',
        name: 'Myntra',
        domain: 'myntra.com',
        mode: 'permitted_scrape',
        enabled: process.env.ENABLE_MYNTRA_SCRAPE === 'true',
        audiences,
        categories: allCategories,
        attributionText: 'Sold on Myntra',
        allowsImageTransform: false,
        allowsScraping: process.env.ENABLE_MYNTRA_SCRAPE === 'true',
        allowedDestinationHosts: ['myntra.com', 'www.myntra.com'],
      },
      {
        sourceId: 'hm',
        name: 'H&M',
        domain: 'hm.com',
        mode: 'permitted_scrape',
        enabled: process.env.ENABLE_HM_SCRAPE === 'true',
        audiences,
        categories: allCategories,
        attributionText: 'Sold on H&M',
        allowsImageTransform: false,
        allowsScraping: process.env.ENABLE_HM_SCRAPE === 'true',
        allowedDestinationHosts: ['hm.com', 'www2.hm.com', 'www.hm.com'],
      },
      {
        sourceId: 'zara',
        name: 'Zara',
        domain: 'zara.com',
        mode: 'permitted_scrape',
        enabled: process.env.ENABLE_ZARA_SCRAPE === 'true',
        audiences,
        categories: allCategories,
        attributionText: 'Sold on Zara',
        allowsImageTransform: false,
        allowsScraping: process.env.ENABLE_ZARA_SCRAPE === 'true',
        allowedDestinationHosts: ['zara.com', 'www.zara.com'],
      },
    ];

    for (const seed of seeds) {
      await Source.findOneAndUpdate(
        { sourceId: seed.sourceId },
        { $set: seed },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }
  }
}
