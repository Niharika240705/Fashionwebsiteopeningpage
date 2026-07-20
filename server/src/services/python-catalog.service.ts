import axios from 'axios';
import { NormalizedProduct } from './ingestion/normalization.service';
import { normalizeAudience, normalizeCategory, Audience } from './ingestion/taxonomy.service';

export interface PythonProductOut {
  id: number;
  retailer_id: string;
  title: string;
  brand: string;
  category: string;
  subcategory?: string | null;
  price?: number | string | null;
  currency: string;
  sizes: string[];
  colors: string[];
  product_url: string;
  primary_image_url?: string | null;
  gender?: string | null;
  description?: string | null;
  category_label?: string | null;
  category_slug?: string | null;
  categorized_at?: string | null;
  categorization_source?: string | null;
  created_at?: string | null;
}

export interface PythonPaginatedProducts {
  items: PythonProductOut[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProductListQuery {
  q?: string;
  category?: string;
  subcategory?: string;
  audience?: string;
  brand?: string[];
  retailer?: string[];
  color?: string[];
  size?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface FormattedProductSummary {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  audience: Audience;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  currency: string;
  images: string[];
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  productUrl: string;
  canonicalUrl?: string;
  sourceWebsite: string;
  retailerId: string;
  sellerName: string;
  offerId?: string;
  redirectPath: string | null;
  attributionText: string;
  disclosureText: string;
  trendScore?: number;
  metadata?: {
    color?: string;
    size?: string[];
    description?: string;
    styleTags?: string[];
  };
  lastVerifiedAt?: string;
  disclaimer: string;
}

const RETAILER_NAMES: Record<string, string> = {
  zara: 'Zara',
  hm: 'H&M',
  mango: 'Mango',
  asos: 'ASOS',
  myntra: 'Myntra',
  ajio: 'Ajio',
  nykaa: 'Nykaa Fashion',
  urbanic: 'Urbanic',
  uniqlo: 'Uniqlo',
};

const GENDER_TO_AUDIENCE: Record<string, Audience> = {
  women: 'women',
  woman: 'women',
  womens: 'women',
  female: 'women',
  men: 'men',
  man: 'men',
  mens: 'men',
  male: 'men',
  kids: 'kids',
  kid: 'kids',
  children: 'kids',
  boys: 'kids',
  girls: 'kids',
};

export function isPythonCatalogEnabled(): boolean {
  return process.env.USE_PYTHON_CATALOG === 'true';
}

export function pythonProductId(id: number): string {
  return `py:${id}`;
}

export function parsePythonProductId(id: string): number | null {
  if (id.startsWith('py:')) {
    const num = parseInt(id.slice(3), 10);
    return Number.isFinite(num) ? num : null;
  }
  if (/^\d+$/.test(id)) {
    return parseInt(id, 10);
  }
  return null;
}

function getBaseUrl(): string {
  return (process.env.PYTHON_INGESTION_API_URL || 'http://localhost:8000').replace(/\/$/, '');
}

export function mapGenderToAudience(gender?: string | null): Audience {
  if (!gender) return 'women';
  const key = gender.trim().toLowerCase();
  return GENDER_TO_AUDIENCE[key] || normalizeAudience(key);
}

export function retailerDisplayName(retailerId: string): string {
  return RETAILER_NAMES[retailerId.toLowerCase()] || retailerId;
}

function parsePrice(value: PythonProductOut['price']): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(num) ? num : 0;
}

/**
 * Prefer the AI/heuristic-assigned `category_slug` (set once at ingest time,
 * see `fashion-ingestion/ai/categorize.py`) since it is guaranteed to match
 * the canonical taxonomy. Falls back to normalizing the raw scraped
 * `category` text for products ingested before categorization ran.
 */
export function resolvePythonCategorySlug(product: PythonProductOut): string {
  return product.category_slug || normalizeCategory(product.category);
}

export function mapPythonProductToSummary(product: PythonProductOut): FormattedProductSummary {
  const audience = mapGenderToAudience(product.gender);
  const category = resolvePythonCategorySlug(product);
  const retailerId = product.retailer_id.toLowerCase();
  const sellerName = retailerDisplayName(retailerId);
  const images = product.primary_image_url ? [product.primary_image_url] : [];

  return {
    id: pythonProductId(product.id),
    name: product.title,
    brand: product.brand,
    category,
    subcategory: product.subcategory || undefined,
    audience,
    price: parsePrice(product.price),
    currency: product.currency || 'INR',
    images,
    availability: 'unknown',
    productUrl: product.product_url,
    canonicalUrl: product.product_url,
    sourceWebsite: retailerId,
    retailerId,
    sellerName,
    redirectPath: null,
    attributionText: `Sold on ${sellerName}`,
    disclosureText: 'We may earn a commission when you buy through links on our site.',
    trendScore: product.created_at ? Math.min(100, product.id % 100) : undefined,
    metadata: {
      color: product.colors[0],
      size: product.sizes.length ? product.sizes : undefined,
      description: product.description || undefined,
      styleTags: product.colors.length > 1 ? product.colors : undefined,
    },
    lastVerifiedAt: product.created_at || undefined,
    disclaimer:
      'Products sourced from partner websites. Click to view on original site. Price and availability may change.',
  };
}

export function mapPythonProductToNormalized(product: PythonProductOut): NormalizedProduct {
  const audience = mapGenderToAudience(product.gender);
  const category = resolvePythonCategorySlug(product);
  const retailerId = product.retailer_id.toLowerCase();
  const price = parsePrice(product.price);
  const images = product.primary_image_url ? [product.primary_image_url] : [];

  return {
    externalProductId: String(product.id),
    name: product.title,
    brand: product.brand,
    category,
    subcategory: product.subcategory || undefined,
    audience,
    price,
    currency: product.currency || 'INR',
    sellerUrl: product.product_url,
    affiliateUrl: product.product_url,
    canonicalUrl: product.product_url,
    imageUrls: images,
    availability: 'unknown',
    color: product.colors[0],
    sizes: product.sizes.length ? product.sizes : undefined,
    description: product.description || undefined,
    fingerprint: `py:${product.id}:${product.product_url}`,
    dedupeKey: `url:${product.product_url}`,
  };
}

function applyClientFilters(
  items: FormattedProductSummary[],
  query: ProductListQuery
): FormattedProductSummary[] {
  let filtered = items;

  if (query.subcategory) {
    const sub = query.subcategory.toLowerCase();
    filtered = filtered.filter((p) => (p.subcategory || '').toLowerCase() === sub);
  }

  if (query.retailer?.length) {
    const retailers = new Set(query.retailer.map((r) => r.toLowerCase()));
    filtered = filtered.filter((p) => retailers.has(p.retailerId));
  }

  if (query.color?.length) {
    const colors = query.color.map((c) => c.toLowerCase());
    filtered = filtered.filter((p) => {
      const productColor = (p.metadata?.color || '').toLowerCase();
      return colors.some((c) => productColor.includes(c));
    });
  }

  if (query.size?.length) {
    const sizes = new Set(query.size.map((s) => s.toUpperCase()));
    filtered = filtered.filter((p) =>
      (p.metadata?.size || []).some((s) => sizes.has(s.toUpperCase()))
    );
  }

  if (query.inStock) {
    filtered = filtered.filter((p) => p.availability === 'in_stock');
  }

  return filtered;
}

function sortProducts(items: FormattedProductSummary[], sortKey: string): FormattedProductSummary[] {
  const sorted = [...items];
  switch (sortKey) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'newest':
      return sorted.sort((a, b) => b.id.localeCompare(a.id));
    case 'trending':
    case 'relevance':
    default:
      return sorted.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
  }
}

function buildFacets(products: FormattedProductSummary[]) {
  const countBy = (values: string[]) => {
    const map = new Map<string, number>();
    for (const value of values) {
      if (!value) continue;
      map.set(value, (map.get(value) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  };

  return {
    brands: countBy(products.map((p) => p.brand)),
    retailers: countBy(products.map((p) => p.retailerId)),
    categories: countBy(products.map((p) => p.category)),
    colors: countBy(products.map((p) => p.metadata?.color || '')),
  };
}

async function fetchPaginated(
  path: string,
  params: Record<string, unknown>
): Promise<PythonPaginatedProducts> {
  const response = await axios.get<PythonPaginatedProducts>(`${getBaseUrl()}${path}`, {
    params,
    timeout: 15000,
  });
  return response.data;
}

export class PythonCatalogService {
  async listProducts(query: ProductListQuery = {}): Promise<{
    products: FormattedProductSummary[];
    total: number;
    page: number;
    pageSize: number;
    sort: string;
    facets: ReturnType<typeof buildFacets>;
  }> {
    const page = Math.max(query.page || 1, 1);
    const pageSize = Math.min(Math.max(query.limit || 20, 1), 100);
    const sortKey = query.sort || 'trending';
    const audience = normalizeAudience(query.audience);

    const params: Record<string, unknown> = {
      page,
      page_size: pageSize,
      // `gender` on the Python side is the same women/men/kids vocabulary as
      // `audience` here, so filtering happens server-side in Postgres, not
      // client-side after the fact.
      gender: audience,
    };

    if (query.category) {
      // category_slug does an exact match against the AI-classified column;
      // this keeps category pages DB-driven per the shared taxonomy.
      params.category_slug = normalizeCategory(query.category);
    }
    if (query.brand?.length === 1) params.brand = query.brand[0];
    if (query.minPrice !== undefined) params.min_price = query.minPrice;
    if (query.maxPrice !== undefined) params.max_price = query.maxPrice;

    const path = query.q?.trim() ? '/search' : '/products';
    if (query.q?.trim()) params.q = query.q.trim();

    const data = await fetchPaginated(path, params);
    let products = data.items.map(mapPythonProductToSummary);

    if (query.brand && query.brand.length > 1) {
      const brands = new Set(query.brand.map((b) => b.toLowerCase()));
      products = products.filter((p) => brands.has(p.brand.toLowerCase()));
    }

    products = applyClientFilters(products, query);
    products = sortProducts(products, sortKey);

    return {
      products,
      total: query.brand && query.brand.length > 1 ? products.length : data.total,
      page: data.page,
      pageSize: data.page_size,
      sort: sortKey,
      facets: buildFacets(products),
    };
  }

  async getTrendingProducts(options: {
    category?: string;
    audience?: string;
    limit?: number;
  } = {}): Promise<FormattedProductSummary[]> {
    const result = await this.listProducts({
      audience: options.audience || 'women',
      category: options.category,
      limit: options.limit || 20,
      sort: 'trending',
      page: 1,
    });
    return result.products;
  }

  async getProduct(id: number): Promise<FormattedProductSummary | null> {
    try {
      const response = await axios.get<PythonProductOut>(`${getBaseUrl()}/products/${id}`, {
        timeout: 15000,
      });
      return mapPythonProductToSummary(response.data);
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async fetchAllProducts(pageSize = 100): Promise<PythonProductOut[]> {
    const all: PythonProductOut[] = [];
    let page = 1;
    let total = Infinity;

    while (all.length < total) {
      const data = await fetchPaginated('/products', { page, page_size: pageSize });
      all.push(...data.items);
      total = data.total;
      if (!data.items.length) break;
      page += 1;
    }

    return all;
  }
}

export const pythonCatalogService = new PythonCatalogService();
