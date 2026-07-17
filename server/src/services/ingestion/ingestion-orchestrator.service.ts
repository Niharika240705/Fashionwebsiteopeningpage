import { IngestionRun } from '../../models/IngestionRun.model';
import { Source } from '../../models/Source.model';
import { getSourceAdapter } from '../../sources/registry';
import { normalizeRawProduct } from './normalization.service';
import { upsertProductAndOffer } from './offer-upsert.service';
import { assertSourceMayIngest, getEnabledSource } from './compliance-policy.service';
import { isWomenMvpCategory } from './taxonomy.service';
import { ImageProcessingService } from '../image-processing.service';

export class IngestionOrchestratorService {
  private imageService = new ImageProcessingService();

  async ingestSource(sourceId: string, options?: { limit?: number; processImages?: boolean }) {
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
      const { products, checkpoint } = await adapter.fetchProducts({ limit: options?.limit });
      run.counts.fetched = products.length;
      run.checkpoint = checkpoint;

      for (const raw of products) {
        try {
          const normalized = normalizeRawProduct(raw, sourceId);
          if (normalized.audience === 'women' && !isWomenMvpCategory(normalized.category)) {
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

  async ensureSeedSources(): Promise<void> {
    const seeds = [
      {
        sourceId: 'demo-affiliate',
        name: 'Demo Affiliate Retailer',
        domain: 'example-retailer.com',
        mode: 'affiliate_feed',
        enabled: true,
        audiences: ['women'],
        categories: ['dresses', 'tops', 'bottoms', 'ethnic-wear', 'footwear', 'bags', 'accessories'],
        attributionText: 'Sold by Demo Affiliate Retailer',
        allowsImageTransform: true,
        allowsScraping: false,
        allowedDestinationHosts: ['example-retailer.com'],
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
        audiences: ['women'],
        categories: ['dresses', 'tops', 'bottoms', 'ethnic-wear', 'footwear', 'bags', 'accessories'],
        attributionText: 'Sold on Myntra',
        allowsImageTransform: false,
        allowsScraping: process.env.ENABLE_MYNTRA_SCRAPE === 'true',
        allowedDestinationHosts: ['myntra.com'],
      },
    ];

    for (const seed of seeds) {
      await Source.findOneAndUpdate({ sourceId: seed.sourceId }, seed, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
    }
  }
}
