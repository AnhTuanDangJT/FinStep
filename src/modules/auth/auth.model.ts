import mongoose, { Schema, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';

export type CareerStage = 'Student' | 'EarlyCareer' | 'Professional' | 'Investor';
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'MENTOR';

/** Single role for display and admin logic: "user" | "admin" (email-based, stored in DB) */
export type Role = 'user' | 'admin';

/** Author credibility level (auto-upgrade by approved count; admin can override) */
export type CredibilityLevel = 'beginner' | 'contributor' | 'trusted_writer' | 'mentor';

/** Profile experience level (blog credibility) */
export type ProfileExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/** Profile focus areas (max 3) */
export type ProfileFocusArea = 'PersonalFinance' | 'Investing' | 'Career' | 'SideHustle';

export const PROFILE_EXPERIENCE_LEVELS: ProfileExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
export const PROFILE_FOCUS_AREAS: ProfileFocusArea[] = ['PersonalFinance', 'Investing', 'Career', 'SideHustle'];

export interface IUser extends Document {
  /** Non-guessable public identifier (uuid); used in URLs and public responses instead of _id */
  publicId: string;
  name: string;
  email: string;
  /** Display name for blog/profile (defaults from name; backward compatible) */
  displayName?: string;
  avatarUrl?: string;
  /** Short bio, max 300 chars */
  bio?: string;
  experienceLevel?: ProfileExperienceLevel;
  focusAreas?: ProfileFocusArea[];
  /** Broad location only (e.g. "UK", "Remote") - no sensitive data */
  location?: string;
  linkedInUrl?: string; // Optional LinkedIn profile URL
  passwordHash?: string; // Optional for OAuth users (renamed from password)
  password?: string; // Legacy field for backward compatibility
  provider: 'local' | 'google'; // Authentication provider
  googleId?: string; // Google OAuth ID
  roles: UserRole[];
  careerStage?: CareerStage;
  /** Last activity timestamp (login or post creation) */
  lastActiveAt?: Date;
  /** UI theme preference for dark mode (optional). */
  themePreference?: 'light' | 'dark';
  /** Single role: "user" | "admin" (synced with roles; admin-added users get adminAddedBy/At) */
  role?: Role;
  /** Set when an admin adds this user as admin (optional) */
  adminAddedBy?: mongoose.Types.ObjectId;
  adminAddedAt?: Date;
  /** Author credibility (auto-upgrade by approved blog count; admin can override) */
  credibilityLevel?: CredibilityLevel;
  credibilityUpdatedBy?: mongoose.Types.ObjectId;
  credibilityUpdatedAt?: Date;
  /** Credibility score 0–100 (spec: new user 50, approved author +5, rejected -10, admin ≥90) */
  credibilityScore?: number;
  /** Soft-ban: user can submit blogs but they always go to PENDING (no notification) */
  isSoftBanned?: boolean;
  /** Suspended: violations → set to 0 + suspend (spec) */
  isSuspended?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio must not exceed 300 characters'],
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      trim: true,
    },
    focusAreas: {
      type: [String],
      enum: ['PersonalFinance', 'Investing', 'Career', 'SideHustle'],
      default: [],
      validate: [
        (arr: string[]) => !arr || arr.length <= 3,
        'focusAreas must have at most 3 items',
      ],
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    lastActiveAt: {
      type: Date,
      required: false,
    },
    linkedInUrl: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: function(this: { provider?: string }) {
        // Password required only for local (email/password) users
        return this.provider === 'local';
      },
      select: false, // Don't return password by default (hashed password is never returned)
    },
    password: {
      // Legacy field for backward compatibility - will be migrated
      type: String,
      select: false,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined, but enforce uniqueness when present
    },
    roles: {
      type: [String],
      enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'MENTOR'],
      default: ['USER'],
      required: true,
    },
    careerStage: {
      type: String,
      enum: ['Student', 'EarlyCareer', 'Professional', 'Investor'],
      trim: true,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark'],
      trim: true,
      default: undefined,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      trim: true,
    },
    adminAddedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    adminAddedAt: {
      type: Date,
      required: false,
    },
    credibilityLevel: {
      type: String,
      enum: ['beginner', 'contributor', 'trusted_writer', 'mentor'],
      default: 'beginner',
      trim: true,
    },
    credibilityUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    credibilityUpdatedAt: {
      type: Date,
      required: false,
    },
    /** Credibility 0–100: new user 50, blog approved +5, rejected -10, admin ≥90 */
    credibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    isSoftBanned: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// email field already has unique: true (creates index); no need for duplicate .index()

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

