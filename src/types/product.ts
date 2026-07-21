export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  designerId?: string;
  category: string;
  subcategory?: string;
  audience?: 'women' | 'men' | 'kids';
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  currency?: string;
  images: string[];
  availability?: 'in_stock' | 'out_of_stock' | 'unknown';
  productUrl?: string;
  retailerId?: string;
  sellerName?: string;
  offerId?: string;
  redirectPath?: string | null;
  attributionText?: string;
  disclosureText?: string;
  trendScore?: number;
  metadata?: {
    color?: string;
    size?: string[];
    material?: string;
    description?: string;
    styleTags?: string[];
    occasion?: string;
    collectionName?: string;
  };
  lastVerifiedAt?: string;
  disclaimer?: string;
}

export interface ProductFacets {
  brands?: Array<{ value: string; count: number }>;
  retailers?: Array<{ value: string; count: number }>;
  categories: Array<{ value: string; count: number }>;
  colors: Array<{ value: string; count: number }>;
  occasions?: Array<{ value: string; count: number }>;
}

export interface DesignerProductQuery {
  category?: string | string[];
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string | string[];
  occasion?: string | string[];
  availability?: 'in_stock';
  sort?: ProductQuery['sort'];
  page?: number;
  limit?: number;
}

export interface DesignerProductListResponse {
  success: boolean;
  designer: import('./designer').Designer;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  sort: string;
  products: ProductSummary[];
  facets: ProductFacets;
}

export interface ProductQuery {
  q?: string;
  audience?: string;
  category?: string;
  subcategory?: string;
  brand?: string | string[];
  retailer?: string | string[];
  color?: string | string[];
  size?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'relevance' | 'trending' | 'price_asc' | 'price_desc' | 'newest' | 'discount';
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  sort: string;
  products: ProductSummary[];
  facets: ProductFacets;
}
