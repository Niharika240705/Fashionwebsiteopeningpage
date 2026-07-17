import { Audience } from '../models/Source.model';

export interface RawSourceProduct {
  externalProductId: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  audience: Audience;
  price: number;
  originalPrice?: number;
  currency?: string;
  sellerUrl: string;
  affiliateUrl?: string;
  imageUrls: string[];
  availability?: 'in_stock' | 'out_of_stock' | 'unknown';
  color?: string;
  sizes?: string[];
  material?: string;
  description?: string;
  gtin?: string;
  mpn?: string;
  rawChecksum?: string;
}

export interface SourceFetchResult {
  products: RawSourceProduct[];
  checkpoint?: string;
}

export interface SourceFetchOptions {
  checkpoint?: string;
  limit?: number;
  audience?: Audience;
  category?: string;
}

export interface SourceAdapter {
  sourceId: string;
  mode: 'affiliate_feed' | 'affiliate_api' | 'permitted_scrape';
  fetchProducts(options?: SourceFetchOptions): Promise<SourceFetchResult>;
}
