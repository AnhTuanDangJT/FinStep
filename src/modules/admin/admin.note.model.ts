import mongoose, { Schema, Document, Model } from 'mongoose';

export type AdminNoteTargetType = 'user' | 'blog';

export interface IAdminNote extends Document {
  targetType: AdminNoteTargetType;
  targetId: mongoose.Types.ObjectId;
  note: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AdminNoteSchema: Schema = new Schema(
  {
    targetType: {
      type: String,
      enum: ['user', 'blog'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AdminNoteSchema.index({ targetType: 1, targetId: 1 });
AdminNoteSchema.index({ createdBy: 1 });

export const AdminNote: Model<IAdminNote> = mongoose.model<IAdminNote>('AdminNote', AdminNoteSchema);
