import mongoose, { Schema, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';

export type CredibilityActionType =
  | 'GRADE_APPLIED'
  | 'MANUAL_ADJUST'
  | 'POST_APPROVED'
  | 'POST_REJECTED'
  | 'SUSPEND'
  | 'REGRADE_REVERSAL'
  | 'REGRADE_APPLIED';

export interface ICredibilityHistory extends Document {
  id: string; // UUID for audit reference
  userEmail: string;
  blogId: string | null; // null if manual adjustment
  actionType: CredibilityActionType;
  delta: number;
  previousScore: number;
  newScore: number;
  adminEmail: string;
  reason: string | null;
  createdAt: Date;
}

const CredibilityHistorySchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    blogId: {
      type: String,
      default: null,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'GRADE_APPLIED',
        'MANUAL_ADJUST',
        'POST_APPROVED',
        'POST_REJECTED',
        'SUSPEND',
        'REGRADE_REVERSAL',
        'REGRADE_APPLIED',
      ],
      index: true,
    },
    delta: {
      type: Number,
      required: true,
    },
    previousScore: {
      type: Number,
      required: true,
    },
    newScore: {
      type: Number,
      required: true,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CredibilityHistorySchema.index({ userEmail: 1, createdAt: -1 });

export const CredibilityHistory: Model<ICredibilityHistory> = mongoose.model<ICredibilityHistory>(
  'CredibilityHistory',
  CredibilityHistorySchema
);
