import { RawSourceProduct } from './types';
import { Audience, normalizeCategory } from '../services/ingestion/taxonomy.service';
import { RetailerListing } from './retailer-listings';
import { fetchMyntraListingViaApi } from './myntra/myntra-api.fetcher';

type ScraperKind = 'myntra' | 'hm' | 'zara';

function createScraper(kind: ScraperKind, limit: number) {
  return import('../services/scraper.service').then(({ ScraperFactory }) => {
    if (kind === 'hm') return ScraperFactory.createHMScraper(limit);
    if (kind === 'zara') return ScraperFactory.createZaraScraper(limit);
    return ScraperFactory.createMyntraScraper(limit);
  });
}

function defaultBrand(kind: ScraperKind, scrapedBrand?: string): string {
  if (scrapedBrand && scrapedBrand.trim()) return scrapedBrand.trim();
  if (kind === 'hm') return 'H&M';
  if (kind === 'zara') return 'Zara';
  return 'Myntra';
}

export async function scrapeListingsToProducts(
  kind: ScraperKind,
  listings: RetailerListing[],
  options?: { limitPerListing?: number }
): Promise<{ products: RawSourceProduct[]; checkpoint: string }> {
  const limitPerListing = options?.limitPerListing || 12;
  const products: RawSourceProduct[] = [];
  let scraper: Awaited<ReturnType<typeof createScraper>> | null = null;

  try {
    for (const listing of listings) {
      console.log(`🛒 Scraping ${listing.label}: ${listing.url}`);

      // Myntra: try public search gateway first (more reliable than HTML)
      if (kind === 'myntra') {
        try {
          const apiProducts = await fetchMyntraListingViaApi(listing, limitPerListing);
          if (apiProducts.length) {
            products.push(...apiProducts);
            console.log(`  ✅ API: ${apiProducts.length} products from ${listing.label}`);
            continue;
          }
        } catch (apiError: any) {
          console.warn(`  ⚠️ Myntra API failed for ${listing.label}: ${apiError?.message?.slice(0, 120)}`);
        }
      }

      try {
        if (!scraper) {
          scraper = await createScraper(kind, limitPerListing);
          await scraper.init();
        }
        const scraped = await scraper.scrapeProducts(listing.url);
        scraped.forEach((item, index) => {
          const sellerUrl = item.productUrl || listing.url;
          const externalProductId =
            sellerUrl.replace(/^https?:\/\//, '').slice(0, 180) || `${kind}-${listing.category}-${index}`;

          products.push({
            externalProductId,
            name: item.name || `${listing.label} item`,
            brand: defaultBrand(kind, item.brand),
            category: normalizeCategory(listing.category),
            audience: listing.audience as Audience,
            price: Number(item.price) || 0,
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            currency: 'INR',
            sellerUrl,
            affiliateUrl: sellerUrl,
            imageUrls: (item.images || []).filter(Boolean).slice(0, 6),
            availability: 'unknown',
            color: item.metadata?.color,
            sizes: item.metadata?.size,
            material: item.metadata?.material,
            description: item.metadata?.description || `${listing.label} from ${defaultBrand(kind)}`,
          });
        });
        console.log(`  ✅ HTML: ${scraped.length} products from ${listing.label}`);
      } catch (htmlError: any) {
        console.warn(`  ⚠️ HTML scrape failed for ${listing.label}: ${htmlError?.message?.slice(0, 120)}`);
      }
    }
  } finally {
    if (scraper) await scraper.close();
  }

  return {
    products,
    checkpoint: listings.map((l) => l.url).join('|'),
  };
}
