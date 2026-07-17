import { SourceAdapter, SourceFetchResult } from '../types';
import { listingsForRetailer } from '../retailer-listings';
import { scrapeListingsToProducts } from '../scrape-listing.helper';
import { Audience } from '../../services/ingestion/taxonomy.service';

/**
 * Permitted multi-category Myntra scraper.
 * Playwright loads lazily; requires ENABLE_MYNTRA_SCRAPE=true on a worker with Chromium.
 */
export class MyntraScraperAdapter implements SourceAdapter {
  sourceId = 'myntra';
  mode = 'permitted_scrape' as const;

  async fetchProducts(options?: {
    checkpoint?: string;
    limit?: number;
    audience?: Audience;
    category?: string;
  }): Promise<SourceFetchResult> {
    if (process.env.ENABLE_MYNTRA_SCRAPE !== 'true') {
      throw new Error(
        'Myntra scraping is disabled. Set ENABLE_MYNTRA_SCRAPE=true and install Playwright browsers.'
      );
    }

    const listings = listingsForRetailer('myntra', {
      audience: options?.audience,
      category: options?.category,
    });

    if (!listings.length) {
      return { products: [], checkpoint: 'no-listings' };
    }

    const limitPerListing = Math.max(4, Math.min(options?.limit || 12, 24));
    return scrapeListingsToProducts('myntra', listings, { limitPerListing });
  }
}
