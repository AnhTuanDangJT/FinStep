/**
 * Profile service – current user profile (editable), public user profile, and activity stats.
 * Never exposes email on public endpoints.
 */
import mongoose from 'mongoose';
import { User, IUser, PROFILE_EXPERIENCE_LEVELS, PROFILE_FOCUS_AREAS } from '../auth/auth.model';
import { BlogPost } from '../posts/post.model';
import { Journey } from '../journey/journey.model';
import type { ProfileExperienceLevel, ProfileFocusArea } from '../auth/auth.model';

/** Current journey summary for dashboard (real-time). */
export interface CurrentJourneySummary {
  journeyId: string;
  title: string;
  currentStep: number;
  totalSteps: number;
  nextStepTitle: string;
}

export interface ProfileMeResponse {
  id: string;
  email: string;
  name: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  experienceLevel?: ProfileExperienceLevel;
  focusAreas: ProfileFocusArea[];
  location?: string;
  linkedInUrl?: string;
  joinedAt: string; // ISO date
  lastActiveAt?: string; // ISO date
  role: string;
  /** Real-time counts (computed). */
  postCount: number;
  journeyCount: number;
  totalLikes: number;
  /** Current (most recent) journey progress for dashboard. */
  currentJourney?: CurrentJourneySummary;
  /** UI theme preference (light | dark). */
  themePreference?: 'light' | 'dark';
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  experienceLevel?: ProfileExperienceLevel;
  focusAreas?: ProfileFocusArea[];
  location?: string;
  themePreference?: 'light' | 'dark';
}

export interface PublicProfileResponse {
  publicId: string;
  emailMasked: string;
  displayName: string;
  credibilityLevel?: string;
  avatarUrlPublic?: string;
  bio?: string;
  experienceLevel?: ProfileExperienceLevel;
  focusAreas: ProfileFocusArea[];
  location?: string;
  postCount: number;
  journeyCount: number;
  createdAtRounded?: string;
}

export interface UserStatsResponse {
  totalLikes: number;
  totalPosts: number;
  totalJourneys: number;
  lastActiveAt?: string; // ISO date
}

function toProfileExperienceLevel(v: unknown): ProfileExperienceLevel | undefined {
  if (typeof v !== 'string') return undefined;
  return PROFILE_EXPERIENCE_LEVELS.includes(v as ProfileExperienceLevel) ? (v as ProfileExperienceLevel) : undefined;
}

function toFocusAreas(arr: unknown): ProfileFocusArea[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x): x is ProfileFocusArea => typeof x === 'string' && PROFILE_FOCUS_AREAS.includes(x as ProfileFocusArea))
    .slice(0, 3);
}

/** Get current (most recent) journey and step counts for dashboard. */
async function getCurrentJourneySummary(userId: string): Promise<CurrentJourneySummary | undefined> {
  const latest = await Journey.findOne({ userId }).sort({ createdAt: -1 }).lean();
  if (!latest) return undefined;
  const journeyId = (latest as { _id: mongoose.Types.ObjectId })._id.toString();
  const title = (latest as { title: string }).title;
  const posts = await BlogPost.find({ journeyId: latest._id }).select('_id title stepNumber').lean();
  const currentStep = posts.length;
  const totalSteps = Math.max(currentStep, 1);
  const nextStepTitle = currentStep === 0 ? 'Write your first post' : 'Write your next post';
  return {
    journeyId,
    title,
    currentStep,
    totalSteps,
    nextStepTitle,
  };
}

/** Get full editable profile for current user (auth required). Includes real-time postCount, journeyCount, totalLikes, currentJourney. */
export async function getProfileMe(userId: string): Promise<ProfileMeResponse | null> {
  const user = await User.findById(userId).lean();
  if (!user) return null;
  const u = user as unknown as IUser & { _id: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date };
  const isAdmin = u.email === 'dganhtuan.2k5@gmail.com' || (u.roles && u.roles.includes('ADMIN'));

  const [postCount, journeyCount, likesResult, currentJourney] = await Promise.all([
    BlogPost.countDocuments({ 'author.userId': userId }),
    Journey.countDocuments({ userId }),
    BlogPost.aggregate<{ totalLikes: number }>([
      { $match: { 'author.userId': userId } },
      { $group: { _id: null, totalLikes: { $sum: '$likes' } } },
      { $project: { totalLikes: 1, _id: 0 } },
    ]),
    getCurrentJourneySummary(userId),
  ]);
  const totalLikes = likesResult[0]?.totalLikes ?? 0;

  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    displayName: u.displayName?.trim() || u.name,
    avatarUrl: u.avatarUrl || undefined,
    bio: u.bio || undefined,
    experienceLevel: u.experienceLevel,
    focusAreas: u.focusAreas || [],
    location: u.location || undefined,
    linkedInUrl: u.linkedInUrl || undefined,
    joinedAt: (u.createdAt && new Date(u.createdAt).toISOString()) || new Date().toISOString(),
    lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : undefined,
    role: isAdmin ? 'ADMIN' : 'USER',
    postCount,
    journeyCount,
    totalLikes,
    currentJourney,
    themePreference: u.themePreference === 'light' || u.themePreference === 'dark' ? u.themePreference : undefined,
  };
}

/** Update current user profile. Only allowed fields; validates bio length and focusAreas count. */
export async function updateProfileMe(userId: string, input: UpdateProfileInput): Promise<ProfileMeResponse | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  if (input.displayName !== undefined) user.displayName = input.displayName.trim();
  if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl.trim() || undefined;
  if (input.bio !== undefined) {
    const bio = input.bio.trim();
    if (bio.length > 300) throw new Error('Bio must not exceed 300 characters');
    user.bio = bio || undefined;
  }
  if (input.experienceLevel !== undefined) user.experienceLevel = toProfileExperienceLevel(input.experienceLevel) ?? undefined;
  if (input.focusAreas !== undefined) {
    const areas = toFocusAreas(input.focusAreas);
    if (areas.length > 3) throw new Error('focusAreas must have at most 3 items');
    user.focusAreas = areas;
  }
  if (input.location !== undefined) user.location = input.location.trim() || undefined;
  if (input.themePreference !== undefined) {
    const v = input.themePreference?.toLowerCase();
    user.themePreference = (v === 'light' || v === 'dark') ? v : undefined;
  }

  await user.save();
  return getProfileMe(userId);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '***@***';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const masked = local.length <= 2 ? '**' : local[0] + '***' + local[local.length - 1];
  return `${masked}@${domain}`;
}

function roundDateToDay(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split('T')[0];
}

type UserLean = IUser & { _id: mongoose.Types.ObjectId; publicId?: string; createdAt?: Date };

/** Get public profile by publicId or legacy _id. NEVER returns raw email or _id. */
export async function getPublicProfile(identifier: string): Promise<PublicProfileResponse | null> {
  let user: UserLean | null = null;
  let matchUserId: string;

  if (UUID_REGEX.test(identifier.trim())) {
    user = await User.findOne({ publicId: identifier.trim() }).lean() as UserLean | null;
    matchUserId = user?._id?.toString() ?? '';
  } else if (mongoose.Types.ObjectId.isValid(identifier)) {
    user = await User.findById(identifier).lean() as UserLean | null;
    matchUserId = identifier;
  } else {
    return null;
  }

  if (!user) return null;
  const u = user;

  const [postCount, journeyCount] = await Promise.all([
    BlogPost.countDocuments({ 'author.userId': matchUserId }),
    Journey.countDocuments({ userId: matchUserId }),
  ]);

  return {
    publicId: u.publicId || u._id.toString(),
    emailMasked: maskEmail(u.email || ''),
    displayName: u.displayName?.trim() || u.name,
    credibilityLevel: u.credibilityLevel || undefined,
    avatarUrlPublic: u.avatarUrl ? (await import('../../config/env')).getAbsoluteUploadUrl(u.avatarUrl) : undefined,
    bio: u.bio || undefined,
    experienceLevel: u.experienceLevel,
    focusAreas: u.focusAreas || [],
    location: u.location || undefined,
    postCount,
    journeyCount,
    createdAtRounded: roundDateToDay(u.createdAt),
  };
}

interface UserStatsLean {
  _id: mongoose.Types.ObjectId;
  lastActiveAt?: Date;
}

/** Get activity stats by publicId or legacy _id. */
export async function getUserStats(identifier: string): Promise<UserStatsResponse | null> {
  let matchUserId: string;
  let lastActiveAt: Date | undefined;

  if (UUID_REGEX.test(identifier.trim())) {
    const found = await User.findOne({ publicId: identifier.trim() }).select('_id lastActiveAt').lean() as UserStatsLean | null;
    if (!found) return null;
    matchUserId = found._id.toString();
    lastActiveAt = found.lastActiveAt;
  } else if (mongoose.Types.ObjectId.isValid(identifier)) {
    const found = await User.findById(identifier).select('lastActiveAt').lean() as UserStatsLean | null;
    if (!found) return null;
    matchUserId = identifier;
    lastActiveAt = found.lastActiveAt;
  } else {
    return null;
  }

  const [postCount, journeyCount, likesResult] = await Promise.all([
    BlogPost.countDocuments({ 'author.userId': matchUserId }),
    Journey.countDocuments({ userId: matchUserId }),
    BlogPost.aggregate<{ totalLikes: number }>([
      { $match: { 'author.userId': matchUserId } },
      { $group: { _id: null, totalLikes: { $sum: '$likes' } } },
      { $project: { totalLikes: 1, _id: 0 } },
    ]),
  ]);

  const totalLikes = likesResult[0]?.totalLikes ?? 0;

  return {
    totalLikes,
    totalPosts: postCount,
    totalJourneys: journeyCount,
    lastActiveAt: lastActiveAt ? new Date(lastActiveAt).toISOString() : undefined,
  };
}

/** Set lastActiveAt to now for the given user (call on login or post creation). */
export async function touchLastActive(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $set: { lastActiveAt: new Date() } });
}

/** Set avatar URL for the current user (used after avatar upload). Stores only the URL string. */
export async function setUserAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $set: { avatarUrl: avatarUrl.trim() || undefined } });
}

const DELETED_AUTHOR_NAME = 'Deleted User';
const DELETED_AUTHOR_EMAIL = 'deleted@deleted.local';

/**
 * Delete the current user's account (self-service). Anonymizes their blog posts so content
 * remains but author shows as "Deleted User". Then removes the user document.
 * Returns true if deleted, false if user not found.
 */
export async function deleteAccount(userId: string): Promise<boolean> {
  const user = await User.findById(userId).select('_id').lean();
  if (!user) return false;

  await BlogPost.updateMany(
    { 'author.userId': userId },
    { $set: { author: { userId, name: DELETED_AUTHOR_NAME, email: DELETED_AUTHOR_EMAIL } } }
  );

  const result = await User.deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
  return (result.deletedCount ?? 0) > 0;
}
