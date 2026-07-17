import mongoose, { Schema, Document } from 'mongoose';

export type SourceMode = 'affiliate_feed' | 'affiliate_api' | 'permitted_scrape';
export type Audience = 'women' | 'men' | 'kids';

export interface ISource extends Document {
  sourceId: string;
  name: string;
  domain: string;
  logoUrl?: string;
  mode: SourceMode;
  enabled: boolean;
  audiences: Audience[];
  categories: string[];
  attributionText: string;
  disclosureText: string;
  allowsImageTransform: boolean;
  allowsScraping: boolean;
  refreshIntervalHours: number;
  maxRequestsPerHour: number;
  affiliateConfig?: {
    network?: string;
    feedUrl?: string;
    apiBaseUrl?: string;
    trackingParam?: string;
    subIdParam?: string;
  };
  allowedDestinationHosts: string[];
  policyVersion: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<ISource>(
  {
    sourceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    domain: { type: String, required: true },
    logoUrl: { type: String },
    mode: {
      type: String,
      enum: ['affiliate_feed', 'affiliate_api', 'permitted_scrape'],
      required: true,
    },
    enabled: { type: Boolean, default: false },
    audiences: {
      type: [String],
      enum: ['women', 'men', 'kids'],
      default: ['women'],
    },
    categories: { type: [String], default: [] },
    attributionText: { type: String, required: true },
    disclosureText: {
      type: String,
      default: 'We may earn a commission when you buy through links on our site.',
    },
    allowsImageTransform: { type: Boolean, default: false },
    allowsScraping: { type: Boolean, default: false },
    refreshIntervalHours: { type: Number, default: 12 },
    maxRequestsPerHour: { type: Number, default: 60 },
    affiliateConfig: {
      network: String,
      feedUrl: String,
      apiBaseUrl: String,
      trackingParam: String,
      subIdParam: String,
    },
    allowedDestinationHosts: { type: [String], default: [] },
    policyVersion: { type: String, default: '1.0' },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export const Source = mongoose.model<ISource>('Source', SourceSchema);
