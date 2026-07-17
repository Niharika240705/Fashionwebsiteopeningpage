import { createHash } from 'crypto';
import { SourceAdapter, SourceFetchResult } from '../types';
import { Audience } from '../../services/ingestion/taxonomy.service';

type DemoItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  audience: Audience;
  price: number;
  originalPrice?: number;
  url: string;
  image: string;
  color?: string;
  sizes?: string[];
  description?: string;
};

/**
 * Partner catalog used when live retailer scraping is blocked (Akamai/bot walls).
 * Destination URLs point at real retailer category/search pages so "Go to retailer" works.
 * Replace with DEMO_AFFILIATE_FEED_URL or ENABLE_*_SCRAPE workers in production.
 */
const DEMO_FEED: DemoItem[] = [
  // Women — wedding / occasion
  {
    id: 'w-gown-001',
    name: 'Sequin Mermaid Wedding Gown',
    brand: 'Myntra Bridal',
    category: 'wedding-gowns',
    audience: 'women',
    price: 12999,
    originalPrice: 18999,
    url: 'https://www.myntra.com/gowns?ref=persona-w-gown-001',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
    color: 'ivory',
    sizes: ['S', 'M', 'L'],
    description: 'Browse wedding gowns on Myntra',
  },
  {
    id: 'w-gown-002',
    name: 'Lace A-Line Bridal Gown',
    brand: 'Myntra Bridal',
    category: 'wedding-gowns',
    audience: 'women',
    price: 15999,
    originalPrice: 22999,
    url: 'https://www.myntra.com/gowns?ref=persona-w-gown-002',
    image: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800&q=80',
    color: 'white',
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    id: 'w-gown-003',
    name: 'Off-Shoulder Evening Gown',
    brand: 'Zara Occasion',
    category: 'wedding-gowns',
    audience: 'women',
    price: 8999,
    url: 'https://www.zara.com/in/en/woman-special-prices-l1314.html',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80',
    color: 'blush',
    sizes: ['S', 'M'],
  },
  {
    id: 'w-dress-001',
    name: 'Floral Midi Dress',
    brand: 'H&M',
    category: 'dresses',
    audience: 'women',
    price: 2499,
    originalPrice: 3999,
    url: 'https://www2.hm.com/en_in/ladies/shop-by-product/dresses.html',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    color: 'pink',
    sizes: ['S', 'M', 'L'],
  },
  {
    id: 'w-dress-002',
    name: 'Satin Slip Dress',
    brand: 'Myntra',
    category: 'dresses',
    audience: 'women',
    price: 1899,
    url: 'https://www.myntra.com/dresses',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
    color: 'black',
    sizes: ['XS', 'S', 'M'],
  },
  {
    id: 'w-top-001',
    name: 'Linen Wrap Top',
    brand: 'H&M',
    category: 'tops',
    audience: 'women',
    price: 1299,
    originalPrice: 1799,
    url: 'https://www2.hm.com/en_in/ladies/shop-by-product/tops.html',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
    color: 'ivory',
    sizes: ['XS', 'S', 'M'],
  },
  {
    id: 'w-bottom-001',
    name: 'High-Rise Wide Jeans',
    brand: 'Myntra',
    category: 'bottoms',
    audience: 'women',
    price: 2199,
    url: 'https://www.myntra.com/women-jeans',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
    color: 'indigo',
    sizes: ['26', '28', '30', '32'],
  },
  {
    id: 'w-ethnic-001',
    name: 'Embroidered Lehenga Set',
    brand: 'Myntra',
    category: 'ethnic-wear',
    audience: 'women',
    price: 7499,
    originalPrice: 9999,
    url: 'https://www.myntra.com/lehenga-choli',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
    color: 'maroon',
    sizes: ['M', 'L', 'XL'],
  },
  {
    id: 'w-ethnic-002',
    name: 'Banarasi Silk Saree',
    brand: 'Myntra',
    category: 'ethnic-wear',
    audience: 'women',
    price: 5999,
    url: 'https://www.myntra.com/saree',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
    color: 'red',
  },
  {
    id: 'w-shoe-001',
    name: 'Block Heel Sandals',
    brand: 'Myntra',
    category: 'footwear',
    audience: 'women',
    price: 2199,
    url: 'https://www.myntra.com/flats',
    image: 'https://images.unsplash.com/photo-1543163521-1bf726b069e0?w=800&q=80',
    color: 'nude',
    sizes: ['36', '37', '38', '39'],
  },
  {
    id: 'w-jew-001',
    name: 'Gold-Plated Hoop Earrings',
    brand: 'Myntra',
    category: 'jewellery',
    audience: 'women',
    price: 899,
    originalPrice: 1299,
    url: 'https://www.myntra.com/jewellery',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    color: 'gold',
  },
  {
    id: 'w-bag-001',
    name: 'Structured Mini Bag',
    brand: 'Myntra',
    category: 'bags',
    audience: 'women',
    price: 1899,
    originalPrice: 2499,
    url: 'https://www.myntra.com/handbags',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
    color: 'black',
  },
  {
    id: 'w-acc-001',
    name: 'Minimal Analog Watch',
    brand: 'Myntra',
    category: 'accessories',
    audience: 'women',
    price: 3499,
    url: 'https://www.myntra.com/watches',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80',
    color: 'silver',
  },
  {
    id: 'w-active-001',
    name: 'Performance Sports Bra Set',
    brand: 'Myntra',
    category: 'activewear',
    audience: 'women',
    price: 1599,
    url: 'https://www.myntra.com/women-sportswear',
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&q=80',
    color: 'black',
    sizes: ['S', 'M', 'L'],
  },

  // Men
  {
    id: 'm-shirt-001',
    name: 'Oxford Cotton Shirt',
    brand: 'H&M',
    category: 'shirts',
    audience: 'men',
    price: 1499,
    originalPrice: 1999,
    url: 'https://www2.hm.com/en_in/men/shop-by-product/shirts.html',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
    color: 'blue',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'm-shirt-002',
    name: 'Linen Resort Shirt',
    brand: 'Zara',
    category: 'shirts',
    audience: 'men',
    price: 2999,
    url: 'https://www.zara.com/in/en/man-shirts-l137.html',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
    color: 'white',
    sizes: ['M', 'L', 'XL'],
  },
  {
    id: 'm-top-001',
    name: 'Essential Crew T-Shirt',
    brand: 'Myntra',
    category: 'tops',
    audience: 'men',
    price: 799,
    url: 'https://www.myntra.com/men-tshirts',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    color: 'grey',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'm-bottom-001',
    name: 'Slim Chino Trousers',
    brand: 'Myntra',
    category: 'bottoms',
    audience: 'men',
    price: 1799,
    url: 'https://www.myntra.com/men-jeans',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
    color: 'khaki',
    sizes: ['30', '32', '34'],
  },
  {
    id: 'm-ethnic-001',
    name: 'Embroidered Kurta Set',
    brand: 'Myntra',
    category: 'ethnic-wear',
    audience: 'men',
    price: 3499,
    originalPrice: 4999,
    url: 'https://www.myntra.com/men-kurtas',
    image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80',
    color: 'cream',
    sizes: ['M', 'L', 'XL'],
  },
  {
    id: 'm-shoe-001',
    name: 'Leather Derby Shoes',
    brand: 'Myntra',
    category: 'footwear',
    audience: 'men',
    price: 4299,
    url: 'https://www.myntra.com/men-casual-shoes',
    image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80',
    color: 'brown',
    sizes: ['40', '41', '42', '43'],
  },
  {
    id: 'm-bag-001',
    name: 'Everyday Backpack',
    brand: 'Myntra',
    category: 'bags',
    audience: 'men',
    price: 1999,
    url: 'https://www.myntra.com/backpacks',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    color: 'navy',
  },
  {
    id: 'm-acc-001',
    name: 'Chronograph Watch',
    brand: 'Myntra',
    category: 'accessories',
    audience: 'men',
    price: 4999,
    url: 'https://www.myntra.com/watches',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    color: 'black',
  },
  {
    id: 'm-jew-001',
    name: 'Stainless Chain Necklace',
    brand: 'Myntra',
    category: 'jewellery',
    audience: 'men',
    price: 999,
    url: 'https://www.myntra.com/men-jewellery',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80',
    color: 'silver',
  },

  // Kids
  {
    id: 'k-dress-001',
    name: 'Printed Party Dress',
    brand: 'Myntra Kids',
    category: 'dresses',
    audience: 'kids',
    price: 1299,
    url: 'https://www.myntra.com/girls-dresses',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80',
    color: 'yellow',
    sizes: ['3-4Y', '5-6Y', '7-8Y'],
  },
  {
    id: 'k-top-001',
    name: 'Graphic Boys T-Shirt',
    brand: 'H&M Kids',
    category: 'tops',
    audience: 'kids',
    price: 599,
    url: 'https://www2.hm.com/en_in/kids/boys/clothing/t-shirts.html',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
    color: 'blue',
    sizes: ['4-5Y', '6-7Y'],
  },
  {
    id: 'k-set-001',
    name: 'Cotton Co-ord Set',
    brand: 'Myntra Kids',
    category: 'sets',
    audience: 'kids',
    price: 1499,
    url: 'https://www.myntra.com/kids-clothing-sets',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    color: 'mint',
    sizes: ['2-3Y', '4-5Y'],
  },
  {
    id: 'k-ethnic-001',
    name: 'Festive Ethnic Set',
    brand: 'Myntra Kids',
    category: 'ethnic-wear',
    audience: 'kids',
    price: 2199,
    url: 'https://www.myntra.com/kids-ethnic-wear',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80',
    color: 'gold',
    sizes: ['3-4Y', '5-6Y'],
  },
  {
    id: 'k-shoe-001',
    name: 'Velcro Sneakers',
    brand: 'Myntra Kids',
    category: 'footwear',
    audience: 'kids',
    price: 999,
    url: 'https://www.myntra.com/kids-shoes',
    image: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80',
    color: 'white',
    sizes: ['28', '30', '32'],
  },
  {
    id: 'k-bag-001',
    name: 'Mini School Backpack',
    brand: 'Myntra Kids',
    category: 'bags',
    audience: 'kids',
    price: 799,
    url: 'https://www.myntra.com/kids',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    color: 'red',
  },
  {
    id: 'k-jew-001',
    name: 'Beaded Bracelet Set',
    brand: 'Myntra Kids',
    category: 'jewellery',
    audience: 'kids',
    price: 399,
    url: 'https://www.myntra.com/jewellery',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    color: 'multi',
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
        throw new Error(`Failed to fetch demo feed: ${response.status}`);
      }
      items = (await response.json()) as DemoItem[];
    }

    const audienceFilter = process.env.DEMO_FEED_AUDIENCE as Audience | undefined;
    if (audienceFilter) {
      items = items.filter((item) => item.audience === audienceFilter);
    }

    const limit = options?.limit || items.length;
    const sliced = items.slice(0, limit);

    const products = sliced.map((item) => {
      const checksum = createHash('sha256')
        .update(`${item.id}:${item.price}:${item.url}`)
        .digest('hex');

      return {
        externalProductId: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        audience: item.audience,
        price: item.price,
        originalPrice: item.originalPrice,
        currency: 'INR',
        sellerUrl: item.url,
        affiliateUrl: item.url,
        imageUrls: [item.image],
        availability: 'in_stock' as const,
        color: item.color,
        sizes: item.sizes,
        description: item.description,
        rawChecksum: checksum,
      };
    });

    return { products, checkpoint: String(sliced.length) };
  }
}
