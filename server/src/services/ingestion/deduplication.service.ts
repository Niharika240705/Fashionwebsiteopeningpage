import { Product, IProduct } from '../../models/Product.model';
import { NormalizedProduct } from './normalization.service';

export async function findExistingProduct(
  normalized: NormalizedProduct,
  sourceId: string
): Promise<IProduct | null> {
  const byExternal = await Product.findOne({
    retailerId: sourceId,
    externalProductIds: normalized.externalProductId,
  });
  if (byExternal) return byExternal;

  if (normalized.canonicalUrl) {
    const byUrl = await Product.findOne({
      $or: [{ canonicalUrl: normalized.canonicalUrl }, { productUrl: normalized.canonicalUrl }],
    });
    if (byUrl) return byUrl;
  }

  if (normalized.gtin) {
    const byGtin = await Product.findOne({ gtin: normalized.gtin });
    if (byGtin) return byGtin;
  }

  if (normalized.mpn) {
    const byMpn = await Product.findOne({
      brand: new RegExp(`^${escapeRegex(normalized.brand)}$`, 'i'),
      mpn: normalized.mpn,
    });
    if (byMpn) return byMpn;
  }

  if (normalized.fingerprint) {
    const byFingerprint = await Product.findOne({ fingerprint: normalized.fingerprint });
    if (byFingerprint) return byFingerprint;
  }

  return null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
