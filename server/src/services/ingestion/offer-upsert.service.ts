import { Product, IProduct } from '../../models/Product.model';
import { Offer } from '../../models/Offer.model';
import { NormalizedProduct } from './normalization.service';
import { findExistingProduct } from './deduplication.service';
import { ImageAsset } from '../../models/ImageAsset.model';

export interface UpsertResult {
  product: IProduct;
  created: boolean;
  updated: boolean;
  imagesQueued: number;
}

export async function upsertProductAndOffer(
  normalized: NormalizedProduct,
  sourceId: string,
  sellerName: string
): Promise<UpsertResult> {
  let product = await findExistingProduct(normalized, sourceId);
  let created = false;
  let updated = false;

  if (!product) {
    product = await Product.create({
      name: normalized.name,
      brand: normalized.brand,
      category: normalized.category,
      subcategory: normalized.subcategory,
      audience: normalized.audience,
      price: normalized.price,
      originalPrice: normalized.originalPrice,
      discountPercentage: normalized.discountPercentage,
      currency: normalized.currency,
      images: {
        original: normalized.imageUrls,
        processed: [],
        approved: [],
      },
      productUrl: normalized.canonicalUrl || normalized.sellerUrl,
      canonicalUrl: normalized.canonicalUrl,
      sourceWebsite: sourceId,
      retailerId: sourceId,
      externalProductIds: [normalized.externalProductId],
      gtin: normalized.gtin,
      mpn: normalized.mpn,
      dedupeKey: normalized.dedupeKey,
      fingerprint: normalized.fingerprint,
      availability: normalized.availability,
      lastScraped: new Date(),
      lastVerifiedAt: new Date(),
      metadata: {
        color: normalized.color,
        size: normalized.sizes,
        material: normalized.material,
        description: normalized.description,
      },
    });
    created = true;
  } else {
    product.price = normalized.price;
    product.originalPrice = normalized.originalPrice;
    product.discountPercentage = normalized.discountPercentage;
    product.availability = normalized.availability;
    product.lastScraped = new Date();
    product.lastVerifiedAt = new Date();
    product.appearanceCount = (product.appearanceCount || 1) + 1;
    if (!product.externalProductIds.includes(normalized.externalProductId)) {
      product.externalProductIds.push(normalized.externalProductId);
    }
    if (normalized.imageUrls.length) {
      const merged = Array.from(new Set([...(product.images?.original || []), ...normalized.imageUrls]));
      product.images.original = merged;
    }
    await product.save();
    updated = true;
  }

  await Offer.findOneAndUpdate(
    { sourceId, externalProductId: normalized.externalProductId },
    {
      productId: product._id,
      sourceId,
      externalProductId: normalized.externalProductId,
      sellerName,
      sellerUrl: normalized.sellerUrl,
      affiliateUrl: normalized.affiliateUrl,
      price: normalized.price,
      originalPrice: normalized.originalPrice,
      discountPercentage: normalized.discountPercentage,
      currency: normalized.currency,
      availability: normalized.availability,
      status: 'active',
      rawChecksum: normalized.rawChecksum,
      lastSeenAt: new Date(),
      lastVerifiedAt: new Date(),
      $setOnInsert: { firstSeenAt: new Date() },
    },
    { upsert: true, new: true }
  );

  let imagesQueued = 0;
  for (const sourceUrl of normalized.imageUrls) {
    const existing = await ImageAsset.findOne({ sourceId, sourceUrl });
    if (!existing) {
      await ImageAsset.create({
        productId: product._id,
        sourceId,
        sourceUrl,
        processingStatus: 'pending',
        allowsTransform: false,
      });
      imagesQueued += 1;
    }
  }

  return { product, created, updated, imagesQueued };
}
