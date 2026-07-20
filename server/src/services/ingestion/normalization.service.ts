import { createHash } from 'crypto';
import { RawSourceProduct } from '../../sources/types';
import { normalizeCategory } from './taxonomy.service';

export interface NormalizedProduct {
  externalProductId: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  audience: 'women' | 'men' | 'kids';
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  currency: string;
  sellerUrl: string;
  affiliateUrl: string;
  canonicalUrl: string;
  imageUrls: string[];
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  color?: string;
  sizes?: string[];
  material?: string;
  description?: string;
  gtin?: string;
  mpn?: string;
  fingerprint: string;
  dedupeKey: string;
  rawChecksum?: string;
}

export function canonicalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const drop = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'clid'];
    drop.forEach((key) => parsed.searchParams.delete(key));
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url.split('?')[0];
  }
}

export function buildFingerprint(input: {
  brand: string;
  name: string;
  category: string;
  color?: string;
  audience?: string;
}): string {
  // audience is included so that identically-named/coloured products across
  // women/men/kids (e.g. a "Bomber Jacket" in olive sold for both men and
  // women) are never treated as the same product during dedupe.
  const raw = [input.brand, input.name, input.category, input.color || '', input.audience || '']
    .map((v) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
    .join('|');
  return createHash('sha1').update(raw).digest('hex');
}

export function normalizeRawProduct(raw: RawSourceProduct, sourceId: string): NormalizedProduct {
  const category = normalizeCategory(raw.category);
  const canonicalUrl = canonicalizeUrl(raw.sellerUrl);
  const brand = raw.brand.trim();
  const name = raw.name.trim();
  const fingerprint = buildFingerprint({
    brand,
    name,
    category,
    color: raw.color,
    audience: raw.audience,
  });
  const dedupeKey = raw.gtin
    ? `gtin:${raw.gtin}`
    : raw.mpn
      ? `mpn:${brand.toLowerCase()}:${raw.mpn}`
      : `url:${canonicalUrl}`;

  const discountPercentage =
    raw.originalPrice && raw.originalPrice > raw.price
      ? Math.round(((raw.originalPrice - raw.price) / raw.originalPrice) * 100)
      : undefined;

  return {
    externalProductId: raw.externalProductId,
    name,
    brand,
    category,
    subcategory: raw.subcategory,
    audience: raw.audience || 'women',
    price: raw.price,
    originalPrice: raw.originalPrice,
    discountPercentage,
    currency: raw.currency || 'INR',
    sellerUrl: raw.sellerUrl,
    affiliateUrl: raw.affiliateUrl || raw.sellerUrl,
    canonicalUrl,
    imageUrls: raw.imageUrls.filter(Boolean),
    availability: raw.availability || 'unknown',
    color: raw.color,
    sizes: raw.sizes,
    material: raw.material,
    description: raw.description,
    gtin: raw.gtin,
    mpn: raw.mpn,
    fingerprint,
    dedupeKey,
    rawChecksum: raw.rawChecksum || createHash('md5').update(JSON.stringify(raw)).digest('hex'),
  };
}

export function sourceScopedExternalId(sourceId: string, externalProductId: string): string {
  return `${sourceId}:${externalProductId}`;
}
