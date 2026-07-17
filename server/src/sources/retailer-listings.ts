import { Audience } from '../services/ingestion/taxonomy.service';

export interface RetailerListing {
  retailer: 'myntra' | 'hm' | 'zara';
  audience: Audience;
  category: string;
  url: string;
  label: string;
}

/**
 * Shoppable listing URLs used by permitted scrapers.
 * Keep rate limits respectful; these are category entry points, not exhaustive catalogs.
 */
export const RETAILER_LISTINGS: RetailerListing[] = [
  // Women — Myntra
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'wedding-gowns',
    url: 'https://www.myntra.com/gowns',
    label: 'Wedding Gowns',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'dresses',
    url: 'https://www.myntra.com/dresses',
    label: 'Dresses',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'tops',
    url: 'https://www.myntra.com/women-tops',
    label: 'Tops',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'bottoms',
    url: 'https://www.myntra.com/women-jeans',
    label: 'Bottoms',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'ethnic-wear',
    url: 'https://www.myntra.com/lehenga-choli',
    label: 'Ethnic / Lehenga',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'footwear',
    url: 'https://www.myntra.com/flats',
    label: 'Footwear',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'bags',
    url: 'https://www.myntra.com/handbags',
    label: 'Bags',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'jewellery',
    url: 'https://www.myntra.com/jewellery',
    label: 'Jewellery',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'accessories',
    url: 'https://www.myntra.com/watches',
    label: 'Accessories',
  },
  {
    retailer: 'myntra',
    audience: 'women',
    category: 'activewear',
    url: 'https://www.myntra.com/women-sportswear',
    label: 'Activewear',
  },

  // Men — Myntra
  {
    retailer: 'myntra',
    audience: 'men',
    category: 'shirts',
    url: 'https://www.myntra.com/men-casual-shirts',
    label: 'Shirts',
  },
  {
    retailer: 'myntra',
    audience: 'men',
    category: 'tops',
    url: 'https://www.myntra.com/men-tshirts',
    label: 'Tops',
  },
  {
    retailer: 'myntra',
    audience: 'men',
    category: 'bottoms',
    url: 'https://www.myntra.com/men-jeans',
    label: 'Bottoms',
  },
  {
    retailer: 'myntra',
    audience: 'men',
    category: 'ethnic-wear',
    url: 'https://www.myntra.com/men-kurtas',
    label: 'Ethnic Wear',
  },
  {
    retailer: 'myntra',
    audience: 'men',
    category: 'footwear',
    url: 'https://www.myntra.com/men-casual-shoes',
    label: 'Footwear',
  },
  {
    retailer: 'myntra',
    audience: 'men',
    category: 'bags',
    url: 'https://www.myntra.com/backpacks',
    label: 'Bags',
  },
  {
    retailer: 'myntra',
    audience: 'men',
    category: 'accessories',
    url: 'https://www.myntra.com/watches',
    label: 'Accessories',
  },
  {
    retailer: 'myntra',
    audience: 'men',
    category: 'jewellery',
    url: 'https://www.myntra.com/men-jewellery',
    label: 'Jewellery',
  },

  // Kids — Myntra
  {
    retailer: 'myntra',
    audience: 'kids',
    category: 'dresses',
    url: 'https://www.myntra.com/girls-dresses',
    label: 'Dresses',
  },
  {
    retailer: 'myntra',
    audience: 'kids',
    category: 'tops',
    url: 'https://www.myntra.com/boys-tshirts',
    label: 'Tops',
  },
  {
    retailer: 'myntra',
    audience: 'kids',
    category: 'sets',
    url: 'https://www.myntra.com/kids-clothing-sets',
    label: 'Sets',
  },
  {
    retailer: 'myntra',
    audience: 'kids',
    category: 'ethnic-wear',
    url: 'https://www.myntra.com/kids-ethnic-wear',
    label: 'Ethnic Wear',
  },
  {
    retailer: 'myntra',
    audience: 'kids',
    category: 'footwear',
    url: 'https://www.myntra.com/kids-shoes',
    label: 'Footwear',
  },

  // Women — H&M (IN)
  {
    retailer: 'hm',
    audience: 'women',
    category: 'dresses',
    url: 'https://www2.hm.com/en_in/ladies/shop-by-product/dresses.html',
    label: 'H&M Dresses',
  },
  {
    retailer: 'hm',
    audience: 'women',
    category: 'tops',
    url: 'https://www2.hm.com/en_in/ladies/shop-by-product/tops.html',
    label: 'H&M Tops',
  },
  {
    retailer: 'hm',
    audience: 'men',
    category: 'shirts',
    url: 'https://www2.hm.com/en_in/men/shop-by-product/shirts.html',
    label: 'H&M Shirts',
  },
  {
    retailer: 'hm',
    audience: 'kids',
    category: 'tops',
    url: 'https://www2.hm.com/en_in/kids/boys/clothing/t-shirts.html',
    label: 'H&M Kids Tops',
  },

  // Women — Zara (IN)
  {
    retailer: 'zara',
    audience: 'women',
    category: 'dresses',
    url: 'https://www.zara.com/in/en/woman-dresses-l121.html',
    label: 'Zara Dresses',
  },
  {
    retailer: 'zara',
    audience: 'women',
    category: 'wedding-gowns',
    url: 'https://www.zara.com/in/en/woman-special-prices-l1314.html',
    label: 'Zara Occasion',
  },
  {
    retailer: 'zara',
    audience: 'men',
    category: 'shirts',
    url: 'https://www.zara.com/in/en/man-shirts-l137.html',
    label: 'Zara Shirts',
  },
];

export function listingsForRetailer(
  retailer: RetailerListing['retailer'],
  filters?: { audience?: Audience; category?: string }
): RetailerListing[] {
  return RETAILER_LISTINGS.filter((listing) => {
    if (listing.retailer !== retailer) return false;
    if (filters?.audience && listing.audience !== filters.audience) return false;
    if (filters?.category && listing.category !== filters.category) return false;
    return true;
  });
}
