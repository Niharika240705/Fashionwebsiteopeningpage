import axios from 'axios';
import { RawSourceProduct } from '../types';
import { Audience, normalizeCategory } from '../../services/ingestion/taxonomy.service';
import { RetailerListing } from '../retailer-listings';

/**
 * Prefer Myntra's public search gateway JSON over brittle HTML scraping.
 * Falls back gracefully when blocked.
 */
export async function fetchMyntraListingViaApi(
  listing: RetailerListing,
  limit: number
): Promise<RawSourceProduct[]> {
  const slug = listing.url.replace(/^https?:\/\/(www\.)?myntra\.com\//, '').split('?')[0];
  if (!slug) return [];

  const endpoint = `https://www.myntra.com/gateway/v2/search/${encodeURIComponent(slug)}`;
  const response = await axios.get(endpoint, {
    timeout: 20000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-IN,en;q=0.9',
      Referer: listing.url,
      Origin: 'https://www.myntra.com',
    },
    params: {
      rows: Math.min(limit, 50),
      o: 0,
      plaEnabled: true,
    },
    validateStatus: (status) => status < 500,
  });

  if (response.status !== 200 || !response.data) {
    throw new Error(`Myntra API status ${response.status} for ${slug}`);
  }

  const productsNode =
    response.data?.products ||
    response.data?.results?.products ||
    response.data?.data?.results?.products ||
    [];

  if (!Array.isArray(productsNode) || !productsNode.length) {
    throw new Error(`Myntra API returned no products for ${slug}`);
  }

  return productsNode.slice(0, limit).map((item: any, index: number) => {
    const productId = String(item.productId || item.searchImage?.itemId || item.code || index);
    const path = item.landingPageUrl || item.productUrl || `/product/${productId}`;
    const sellerUrl = path.startsWith('http') ? path : `https://www.myntra.com/${path.replace(/^\//, '')}`;
    const image =
      item.searchImage ||
      item.images?.[0]?.src ||
      item.defaultImage?.src ||
      item.imageEntry_default?.imageUrl ||
      '';

    const images = [
      image,
      ...(Array.isArray(item.images) ? item.images.map((img: any) => img?.src).filter(Boolean) : []),
    ].filter(Boolean);

    return {
      externalProductId: `myntra-${productId}`,
      name: item.productName || item.name || `${listing.label} item`,
      brand: item.brand || item.brandName || 'Myntra',
      category: normalizeCategory(listing.category),
      audience: listing.audience as Audience,
      price: Number(item.price || item.mrp || item.discountedPrice || 0),
      originalPrice: item.mrp && item.price && item.mrp > item.price ? Number(item.mrp) : undefined,
      currency: 'INR',
      sellerUrl,
      affiliateUrl: sellerUrl,
      imageUrls: images.slice(0, 6),
      availability: 'unknown',
      color: Array.isArray(item.primaryColour) ? item.primaryColour[0] : item.primaryColour,
      description: `${listing.label} from Myntra`,
    } as RawSourceProduct;
  });
}
