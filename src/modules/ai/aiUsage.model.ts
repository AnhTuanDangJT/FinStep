import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Optional: track AI usage for rate limiting / analytics.
 * Stores only metadata (userId, ipHash, actionType, createdAt) – no user text.
 */
export interface IAiUsage extends Document {
  userId: string | null;
  ipHash: string;
  actionType: string;
  createdAt: Date;
}

const AiUsageSchema = new Schema(
  {
    userId: { type: String, required: false, default: null },
    ipHash: { type: String, required: true },
    actionType: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AiUsageSchema.index({ ipHash: 1, createdAt: -1 });
AiUsageSchema.index({ userId: 1, createdAt: -1 });

export const AiUsage: Model<IAiUsage> = mongoose.model<IAiUsage>('AiUsage', AiUsageSchema);
