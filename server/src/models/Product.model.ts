import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  discountPercentage?: number;
  images: {
    original: string[];
    processed: string[];
  };
  productUrl: string;
  sourceWebsite: string; // e.g., 'myntra', 'hm', 'zara'
  trendScore: number;
  appearanceCount: number; // How many times seen across sites
  lastScraped: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    color?: string;
    size?: string[];
    material?: string;
    description?: string;
  };
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    brand: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    discount: {
      type: Number,
    },
    discountPercentage: {
      type: Number,
    },
    images: {
      original: [String],
      processed: [String],
    },
    productUrl: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sourceWebsite: {
      type: String,
      required: true,
      index: true,
    },
    trendScore: {
      type: Number,
      default: 0,
      index: true,
    },
    appearanceCount: {
      type: Number,
      default: 1,
    },
    lastScraped: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      color: String,
      size: [String],
      material: String,
      description: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ProductSchema.index({ category: 1, brand: 1 });
ProductSchema.index({ trendScore: -1, createdAt: -1 });
ProductSchema.index({ sourceWebsite: 1, lastScraped: -1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

