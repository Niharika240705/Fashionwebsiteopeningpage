import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClickEvent extends Document {
  clickId: string;
  offerId: Types.ObjectId;
  productId: Types.ObjectId;
  sourceId: string;
  placement?: string;
  sessionId?: string;
  userId?: string;
  destinationHost: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClickEventSchema = new Schema<IClickEvent>(
  {
    clickId: { type: String, required: true, unique: true, index: true },
    offerId: { type: Schema.Types.ObjectId, ref: 'Offer', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sourceId: { type: String, required: true, index: true },
    placement: { type: String },
    sessionId: { type: String },
    userId: { type: String },
    destinationHost: { type: String, required: true },
  },
  { timestamps: true }
);

ClickEventSchema.index({ createdAt: -1 });
ClickEventSchema.index({ sourceId: 1, createdAt: -1 });

export const ClickEvent = mongoose.model<IClickEvent>('ClickEvent', ClickEventSchema);
