import mongoose, { Schema, Document, Types } from 'mongoose';

export type ImageProcessingStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'review';

export interface IImageAsset extends Document {
  productId?: Types.ObjectId;
  sourceId: string;
  sourceUrl: string;
  storageKey?: string;
  processedUrl?: string;
  checksum?: string;
  perceptualHash?: string;
  allowsTransform: boolean;
  processingStatus: ImageProcessingStatus;
  personDetected?: boolean;
  personConfidence?: number;
  segmentationConfidence?: number;
  rejectionReason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ImageAssetSchema = new Schema<IImageAsset>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    sourceId: { type: String, required: true, index: true },
    sourceUrl: { type: String, required: true },
    storageKey: { type: String },
    processedUrl: { type: String },
    checksum: { type: String, index: true },
    perceptualHash: { type: String, index: true },
    allowsTransform: { type: Boolean, default: false },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'approved', 'rejected', 'review'],
      default: 'pending',
      index: true,
    },
    personDetected: { type: Boolean },
    personConfidence: { type: Number },
    segmentationConfidence: { type: Number },
    rejectionReason: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

ImageAssetSchema.index({ sourceUrl: 1, sourceId: 1 }, { unique: true });

export const ImageAsset = mongoose.model<IImageAsset>('ImageAsset', ImageAssetSchema);
