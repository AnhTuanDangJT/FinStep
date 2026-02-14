import mongoose, { Schema, Document, Model } from 'mongoose';

export const EXPERIENCE_LEVELS = [
  'Undergraduate',
  'New grade',
  'Junior',
  'Senior',
  'Freshman',
  'Master',
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface IMentorshipRegistration extends Document {
  name: string;
  school: string;
  experienceLevel: ExperienceLevel;
  major: string;
  financeFocus: string;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MentorshipRegistrationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    school: {
      type: String,
      required: [true, 'School is required'],
      trim: true,
      maxlength: [150, 'School must not exceed 150 characters'],
    },
    experienceLevel: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      required: [true, 'Experience level is required'],
    },
    major: {
      type: String,
      required: [true, 'Major is required'],
      trim: true,
      maxlength: [120, 'Major must not exceed 120 characters'],
    },
    financeFocus: {
      type: String,
      required: [true, 'Finance focus is required'],
      trim: true,
      maxlength: [200, 'Finance focus must not exceed 200 characters'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

MentorshipRegistrationSchema.index({ name: 1 });
MentorshipRegistrationSchema.index({ createdAt: -1 });

export const MentorshipRegistration: Model<IMentorshipRegistration> =
  mongoose.model<IMentorshipRegistration>(
    'MentorshipRegistration',
    MentorshipRegistrationSchema
  );
