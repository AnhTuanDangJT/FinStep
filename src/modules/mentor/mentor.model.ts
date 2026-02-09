import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMentorProfile extends Document {
  userId: string;
  pathTitle: string;
  description: string;
  contactLink: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MentorProfileSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    pathTitle: {
      type: String,
      required: [true, 'Path title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    contactLink: {
      type: String,
      default: '',
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const MentorProfile: Model<IMentorProfile> = mongoose.model<IMentorProfile>(
  'MentorProfile',
  MentorProfileSchema
);
