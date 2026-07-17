import mongoose, { Schema, Document, Types } from 'mongoose';

export type OfferAvailability = 'in_stock' | 'out_of_stock' | 'unknown';
export type OfferStatus = 'active' | 'stale' | 'inactive';

export interface IOffer extends Document {
  productId: Types.ObjectId;
  sourceId: string;
  externalProductId: string;
  sellerName: string;
  sellerUrl: string;
  affiliateUrl: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  currency: string;
  availability: OfferAvailability;
  status: OfferStatus;
  rawChecksum?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastVerifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sourceId: { type: String, required: true, index: true },
    externalProductId: { type: String, required: true },
    sellerName: { type: String, required: true },
    sellerUrl: { type: String, required: true },
    affiliateUrl: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discountPercentage: { type: Number },
    currency: { type: String, default: 'INR' },
    availability: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'unknown'],
      default: 'unknown',
    },
    status: {
      type: String,
      enum: ['active', 'stale', 'inactive'],
      default: 'active',
      index: true,
    },
    rawChecksum: { type: String },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    lastVerifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

OfferSchema.index({ sourceId: 1, externalProductId: 1 }, { unique: true });
OfferSchema.index({ productId: 1, status: 1, price: 1 });
OfferSchema.index({ status: 1, lastSeenAt: -1 });

export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);
