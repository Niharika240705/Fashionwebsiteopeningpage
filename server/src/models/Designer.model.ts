import mongoose, { Schema, Document } from 'mongoose';

/**
 * Designer directory (Sabyasachi, Manish Malhotra, etc.) — the source of
 * truth for `/designers` and `/designers/:slug`. Frontend always reads this
 * via the API; adding a new designer later is a DB insert, never a frontend
 * code change.
 */
export interface IDesigner extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  coverImageUrl: string;
  shortDescription: string;
  specializations: string[];
  websiteUrl?: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  metadata?: {
    foundedYear?: number;
    city?: string;
    tagline?: string;
    signatureStyles?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const DesignerSchema = new Schema<IDesigner>(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    logoUrl: { type: String },
    coverImageUrl: { type: String, required: true },
    shortDescription: { type: String, required: true },
    specializations: { type: [String], default: [], index: true },
    websiteUrl: { type: String },
    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    metadata: {
      foundedYear: Number,
      city: String,
      tagline: String,
      signatureStyles: [String],
    },
  },
  { timestamps: true }
);

DesignerSchema.index({ active: 1, featured: -1, sortOrder: 1 });
DesignerSchema.index({ name: 'text', shortDescription: 'text', specializations: 'text' });

export const Designer = mongoose.model<IDesigner>('Designer', DesignerSchema);
