import { createHash } from 'crypto';
import { SourceAdapter, SourceFetchResult } from '../types';

/**
 * Demo affiliate feed adapter for the women's MVP.
 * Replace DEMO_FEED with a real partner CSV/JSON feed once credentials are available.
 */
const DEMO_FEED = [
  {
    id: 'demo-dress-001',
    name: 'Floral Midi Dress',
    brand: 'Demo Atelier',
    category: 'dresses',
    price: 2499,
    originalPrice: 3999,
    url: 'https://example-retailer.com/products/floral-midi-dress',
    image: 'https://via.placeholder.com/600x800?text=Floral+Midi+Dress',
    color: 'pink',
    sizes: ['S', 'M', 'L'],
  },
  {
    id: 'demo-top-001',
    name: 'Linen Wrap Top',
    brand: 'Coastal Label',
    category: 'tops',
    price: 1299,
    originalPrice: 1799,
    url: 'https://example-retailer.com/products/linen-wrap-top',
    image: 'https://via.placeholder.com/600x800?text=Linen+Wrap+Top',
    color: 'ivory',
    sizes: ['XS', 'S', 'M'],
  },
  {
    id: 'demo-ethnic-001',
    name: 'Embroidered Anarkali Set',
    brand: 'Local Loom',
    category: 'ethnic-wear',
    price: 5499,
    originalPrice: 7999,
    url: 'https://example-retailer.com/products/embroidered-anarkali',
    image: 'https://via.placeholder.com/600x800?text=Anarkali+Set',
    color: 'maroon',
    sizes: ['M', 'L', 'XL'],
  },
  {
    id: 'demo-shoe-001',
    name: 'Block Heel Sandals',
    brand: 'Stride Co',
    category: 'footwear',
    price: 2199,
    url: 'https://example-retailer.com/products/block-heel-sandals',
    image: 'https://via.placeholder.com/600x800?text=Block+Heel+Sandals',
    color: 'nude',
    sizes: ['36', '37', '38', '39'],
  },
  {
    id: 'demo-bag-001',
    name: 'Structured Mini Bag',
    brand: 'Urban Hide',
    category: 'bags',
    price: 1899,
    originalPrice: 2499,
    url: 'https://example-retailer.com/products/structured-mini-bag',
    image: 'https://via.placeholder.com/600x800?text=Mini+Bag',
    color: 'black',
  },
];

export class DemoAffiliateAdapter implements SourceAdapter {
  sourceId = 'demo-affiliate';
  mode = 'affiliate_feed' as const;

  async fetchProducts(options?: { checkpoint?: string; limit?: number }): Promise<SourceFetchResult> {
    const feedUrl = process.env.DEMO_AFFILIATE_FEED_URL;
    let items = DEMO_FEED;

    if (feedUrl) {
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Demo affiliate feed failed: ${response.status}`);
      }
      const data: any = await response.json();
      items = Array.isArray(data) ? data : data.products || [];
    }

    const limit = options?.limit || items.length;
    const products = items.slice(0, limit).map((item: any) => ({
      externalProductId: String(item.id),
      name: item.name,
      brand: item.brand,
      category: item.category,
      audience: 'women' as const,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
      currency: 'INR',
      sellerUrl: item.url,
      affiliateUrl: `${item.url}?aff=fashioninsta&subid=demo`,
      imageUrls: [item.image].filter(Boolean),
      availability: 'in_stock' as const,
      color: item.color,
      sizes: item.sizes,
      description: item.description,
      rawChecksum: createHash('md5').update(JSON.stringify(item)).digest('hex'),
    }));

    return { products, checkpoint: new Date().toISOString() };
  }
}
