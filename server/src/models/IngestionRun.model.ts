import mongoose, { Schema, Document } from 'mongoose';

export type IngestionRunStatus = 'running' | 'completed' | 'failed' | 'partial';

export interface IIngestionRun extends Document {
  sourceId: string;
  mode: string;
  status: IngestionRunStatus;
  startedAt: Date;
  finishedAt?: Date;
  checkpoint?: string;
  counts: {
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    imagesQueued: number;
  };
  errorSummary?: string;
  policyVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IngestionRunSchema = new Schema<IIngestionRun>(
  {
    sourceId: { type: String, required: true, index: true },
    mode: { type: String, required: true },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'partial'],
      default: 'running',
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    checkpoint: { type: String },
    counts: {
      fetched: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      imagesQueued: { type: Number, default: 0 },
    },
    errorSummary: { type: String },
    policyVersion: { type: String },
  },
  { timestamps: true }
);

IngestionRunSchema.index({ sourceId: 1, startedAt: -1 });

export const IngestionRun = mongoose.model<IIngestionRun>('IngestionRun', IngestionRunSchema);
