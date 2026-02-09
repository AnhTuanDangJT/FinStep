import mongoose, { Schema, Document, Model } from 'mongoose';

export type JourneyGoal = 'Saving' | 'Investing' | 'Career' | 'SideHustle';

export interface IJourney extends Document {
  userId: string;
  title: string;
  goal: JourneyGoal;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JourneySchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    goal: {
      type: String,
      enum: ['Saving', 'Investing', 'Career', 'SideHustle'],
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

JourneySchema.index({ userId: 1, createdAt: -1 });

export const Journey: Model<IJourney> = mongoose.model<IJourney>('Journey', JourneySchema);
