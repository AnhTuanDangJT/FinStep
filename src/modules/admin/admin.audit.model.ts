import mongoose, { Schema, Document, Model } from 'mongoose';

/** Immutable audit log for all admin actions */
export interface IAuditLog extends Document {
  actionType: string;
  targetId: string | null;
  performedBy: string;
  performedByEmail: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

const AuditLogSchema: Schema = new Schema(
  {
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: String,
      default: null,
    },
    performedBy: {
      type: String,
      required: true,
      trim: true,
    },
    performedByEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: false, _id: true }
);

AuditLogSchema.index({ actionType: 1 });
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ targetId: 1 });

// Append-only: only create() in code; never update or delete

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
