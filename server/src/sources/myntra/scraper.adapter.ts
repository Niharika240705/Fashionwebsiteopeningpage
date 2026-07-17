import { SourceAdapter, SourceFetchResult, RawSourceProduct } from '../types';
import { normalizeCategory } from '../../services/ingestion/taxonomy.service';

/**
 * Permitted-scrape fallback for Myntra.
 * Playwright is loaded lazily so the Render web service can build/start
 * without Chromium unless ENABLE_MYNTRA_SCRAPE=true.
 */
export class MyntraScraperAdapter implements SourceAdapter {
  sourceId = 'myntra';
  mode = 'permitted_scrape' as const;

  async fetchProducts(options?: { checkpoint?: string; limit?: number }): Promise<SourceFetchResult> {
    if (process.env.ENABLE_MYNTRA_SCRAPE !== 'true') {
      throw new Error(
        'Myntra scraping is disabled. Set ENABLE_MYNTRA_SCRAPE=true and install Playwright browsers on a worker.'
      );
    }

    const { ScraperFactory } = await import('../../services/scraper.service');

    const url =
      process.env.MYNTRA_WOMEN_LISTING_URL ||
      process.env.MYNTRA_LISTING_URL ||
      'https://www.myntra.com/women-dresses';

    const limit = options?.limit || 40;
    const scraper = ScraperFactory.createMyntraScraper(limit);
    await scraper.init();
    try {
      const scraped = await scraper.scrapeProducts(url);
      const products: RawSourceProduct[] = scraped.map((item, index) => ({
        externalProductId: item.productUrl || `myntra-${index}`,
        name: item.name,
        brand: item.brand,
        category: normalizeCategory(item.category || 'dresses'),
        audience: 'women',
        price: item.price,
        originalPrice: item.originalPrice,
        currency: 'INR',
        sellerUrl: item.productUrl,
        affiliateUrl: item.productUrl,
        imageUrls: item.images || [],
        availability: 'unknown',
        color: item.metadata?.color,
        sizes: item.metadata?.size,
        material: item.metadata?.material,
        description: item.metadata?.description,
      }));

      return { products, checkpoint: url };
    } finally {
      await scraper.close();
    }
  }
}
