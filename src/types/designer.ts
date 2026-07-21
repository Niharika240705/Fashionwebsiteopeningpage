export interface Designer {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverImageUrl: string;
  shortDescription: string;
  specializations: string[];
  websiteUrl?: string;
  featured: boolean;
  sortOrder?: number;
  metadata?: {
    foundedYear?: number;
    city?: string;
    tagline?: string;
    signatureStyles?: string[];
  };
  productCount?: number;
}

export interface DesignerListResponse {
  success: boolean;
  count: number;
  designers: Designer[];
}

export interface DesignerDetailResponse {
  success: boolean;
  designer: Designer;
}

export interface DesignerQuery {
  specialization?: string | string[];
  q?: string;
  featured?: boolean;
}

export interface SearchResponse {
  success: boolean;
  q: string;
  designers: Designer[];
  products: import('./product').ProductSummary[];
  total: number;
}
