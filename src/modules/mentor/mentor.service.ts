/**
 * Mentor service - provides mentor information and profiles (with verification)
 */
import mongoose from 'mongoose';
import { MentorProfile, IMentorProfile } from './mentor.model';
import { User } from '../auth/auth.model';

export interface MentorInfo {
  name: string;
  description: string;
  facebookLink: string;
}

/** Legacy: single hardcoded mentor (backward compat) */
export const getMentorInfo = async (): Promise<MentorInfo> => {
  return {
    name: 'Nguyen Banhs',
    description: 'Experienced financial mentor dedicated to helping you achieve your financial goals.',
    facebookLink: 'https://www.facebook.com/nguyen.banhs',
  };
};

/** Primary mentor response for GET /api/mentor/primary – educational, extensible */
export interface PrimaryMentorResponse {
  name: string;
  fields: string[];
  bio: string;
  whyMentor: {
    finance: string[];
    cs: string[];
  };
  ctaUrl: string;
}

/** Primary mentor (Bùi Đình Trí). Public, no auth. Structured for future multi-mentor support. */
export const getPrimaryMentor = async (): Promise<PrimaryMentorResponse> => {
  return {
    name: 'Bùi Đình Trí',
    fields: ['Finance', 'Computer Science'],
    bio: 'Experienced mentor in finance and software. Helps learners avoid costly beginner mistakes, build decision frameworks, and bridge the gap between school and industry.',
    whyMentor: {
      finance: [
        'Avoid costly beginner mistakes — get guidance before you commit time and money.',
        'Learn decision frameworks, not just tips — understand how to think long-term about money.',
        'Understand long-term thinking — from budgeting to investing, mentors help you see the big picture.',
      ],
      cs: [
        'Bridge the gap between school and industry — real projects, real expectations.',
        'Learn what hiring managers actually look for — resumes, interviews, and system design.',
        'Improve problem-solving and system thinking — think in systems, not just snippets.',
      ],
    },
    ctaUrl: 'https://www.facebook.com/tri.dinhbui02#',
  };
};

export interface MentorProfilePublic {
  userId: string;
  pathTitle: string;
  description: string;
  contactLink: string;
  verified: boolean;
  name?: string;
  role?: string;
  createdAt?: Date;
}

/** List all mentor profiles with verification and role (public) */
export const listMentorProfiles = async (): Promise<MentorProfilePublic[]> => {
  const profiles = await MentorProfile.find({}).sort({ createdAt: -1 }).lean();
  const userIds = [...new Set((profiles as unknown as IMentorProfile[]).map((p) => p.userId))];
  const objectIds = userIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const users = await User.find({ _id: { $in: objectIds } }).select('name roles').lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  return (profiles as unknown as IMentorProfile[]).map((p) => ({
    userId: p.userId,
    pathTitle: p.pathTitle,
    description: p.description || '',
    contactLink: p.contactLink || '',
    verified: !!p.verified,
    name: userMap.get(p.userId)?.name,
    role: userMap.get(p.userId)?.roles?.includes('MENTOR') ? 'MENTOR' : 'USER',
    createdAt: p.createdAt,
  }));
};

/** Set mentor verified (admin only) */
export const setMentorVerified = async (
  userId: string,
  verified: boolean
): Promise<IMentorProfile | null> => {
  const profile = await MentorProfile.findOneAndUpdate(
    { userId },
    { $set: { verified } },
    { new: true }
  );
  return profile;
};

/** List mentor profiles (admin) - same as public but for admin view */
export const listMentorsForAdmin = async (): Promise<MentorProfilePublic[]> => {
  return listMentorProfiles();
};

/** Create or update own mentor profile (authenticated user). Verified can only be set by admin. */
export const upsertMentorProfile = async (
  userId: string,
  input: { pathTitle: string; description?: string; contactLink?: string }
): Promise<IMentorProfile> => {
  const update = {
    pathTitle: input.pathTitle.trim(),
    description: (input.description ?? '').trim(),
    contactLink: (input.contactLink ?? '').trim(),
  };
  const profile = await MentorProfile.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  return profile;
};



