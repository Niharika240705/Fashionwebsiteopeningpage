import mongoose, { Schema, Document } from 'mongoose';

export type Audience = 'women' | 'men' | 'kids';

export interface IProduct extends Document {
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  audience: Audience;
  price: number;
  originalPrice?: number;
  discount?: number;
  discountPercentage?: number;
  currency: string;
  images: {
    original: string[];
    processed: string[];
    approved: string[];
  };
  productUrl: string;
  canonicalUrl?: string;
  sourceWebsite: string;
  retailerId?: string;
  externalProductIds: string[];
  gtin?: string;
  mpn?: string;
  dedupeKey?: string;
  fingerprint?: string;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  trendScore: number;
  appearanceCount: number;
  lastScraped: Date;
  lastVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    color?: string;
    size?: string[];
    material?: string;
    description?: string;
    styleTags?: string[];
  };
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    brand: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, index: true },
    audience: {
      type: String,
      enum: ['women', 'men', 'kids'],
      default: 'women',
      index: true,
    },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number },
    discountPercentage: { type: Number },
    currency: { type: String, default: 'INR' },
    images: {
      original: [String],
      processed: [String],
      approved: [String],
    },
    productUrl: { type: String, required: true, unique: true, index: true },
    canonicalUrl: { type: String, index: true },
    sourceWebsite: { type: String, required: true, index: true },
    retailerId: { type: String, index: true },
    externalProductIds: { type: [String], default: [] },
    gtin: { type: String, index: true, sparse: true },
    mpn: { type: String, index: true, sparse: true },
    dedupeKey: { type: String, index: true },
    fingerprint: { type: String, index: true },
    availability: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'unknown'],
      default: 'unknown',
      index: true,
    },
    trendScore: { type: Number, default: 0, index: true },
    appearanceCount: { type: Number, default: 1 },
    lastScraped: { type: Date, default: Date.now },
    lastVerifiedAt: { type: Date },
    metadata: {
      color: String,
      size: [String],
      material: String,
      description: String,
      styleTags: [String],
    },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1, brand: 1 });
ProductSchema.index({ audience: 1, category: 1, trendScore: -1 });
ProductSchema.index({ trendScore: -1, createdAt: -1 });
ProductSchema.index({ sourceWebsite: 1, lastScraped: -1 });
ProductSchema.index({ name: 'text', brand: 'text', category: 'text', 'metadata.description': 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
