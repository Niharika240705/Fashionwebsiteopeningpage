import { SourceAdapter, SourceFetchResult } from '../types';
import { listingsForRetailer } from '../retailer-listings';
import { scrapeListingsToProducts } from '../scrape-listing.helper';
import { Audience } from '../../services/ingestion/taxonomy.service';

export class HMScraperAdapter implements SourceAdapter {
  sourceId = 'hm';
  mode = 'permitted_scrape' as const;

  async fetchProducts(options?: {
    checkpoint?: string;
    limit?: number;
    audience?: Audience;
    category?: string;
  }): Promise<SourceFetchResult> {
    if (process.env.ENABLE_HM_SCRAPE !== 'true') {
      throw new Error('H&M scraping is disabled. Set ENABLE_HM_SCRAPE=true on a worker with Playwright.');
    }

    const listings = listingsForRetailer('hm', {
      audience: options?.audience,
      category: options?.category,
    });
    if (!listings.length) return { products: [], checkpoint: 'no-listings' };

    const limitPerListing = Math.max(4, Math.min(options?.limit || 10, 20));
    return scrapeListingsToProducts('hm', listings, { limitPerListing });
  }
}
