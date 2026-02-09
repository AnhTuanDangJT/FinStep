import mongoose from 'mongoose';
import { User } from '../auth/auth.model';
import { CredibilityHistory, type CredibilityActionType } from './credibility.model';

const MIN_SCORE = 0;
const MAX_SCORE = 100;

/** Clamp credibility score to 0..100 */
export function clampCredibility(score: number): number {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(score)));
}

/**
 * Grade (0–100) → delta mapping:
 * 90–100: +10 (EXCELLENT)
 * 75–89: +5 (GOOD)
 * 60–74: +2 (AVERAGE)
 * 40–59: -5 (WEAK)
 * 0–39: -20 (SPAM)
 */
export function gradeToDelta(grade: number): number {
  if (grade >= 90) return 10;
  if (grade >= 75) return 5;
  if (grade >= 60) return 2;
  if (grade >= 40) return -5;
  return -20;
}

/** Grade (0–100) → label */
export function gradeToLabel(grade: number): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK' | 'SPAM' {
  if (grade >= 90) return 'EXCELLENT';
  if (grade >= 75) return 'GOOD';
  if (grade >= 60) return 'AVERAGE';
  if (grade >= 40) return 'WEAK';
  return 'SPAM';
}

export interface ApplyDeltaMeta {
  actionType: CredibilityActionType;
  blogId?: string | null;
  adminEmail: string;
  reason?: string | null;
}

/**
 * Apply a credibility delta to a user in a transaction.
 * Locks user row, computes newScore = clamp(previous + delta), updates user, inserts CredibilityHistory.
 * Uses user email (not internal id) for lookup.
 * previousScore defaults to 0 when undefined.
 * When existingSession is provided, uses it (caller owns transaction/session lifecycle).
 */
export async function applyDelta(
  userEmail: string,
  delta: number,
  meta: ApplyDeltaMeta,
  existingSession?: mongoose.ClientSession
): Promise<{ previousScore: number; newScore: number }> {
  const ownSession = !existingSession;
  const session = existingSession ?? (await mongoose.startSession());
  if (ownSession) session.startTransaction();
  try {
    const email = userEmail.toLowerCase().trim();
    const user = await User.findOne({ email }).session(session).select('credibilityScore').exec();
    if (!user) {
      if (ownSession) await session.abortTransaction();
      throw new Error('User not found');
    }

    const previousScore = (user as any).credibilityScore ?? 0;
    const newScore = clampCredibility(previousScore + delta);

    (user as any).credibilityScore = newScore;
    await user.save({ session });

    await CredibilityHistory.create(
      [
        {
          userEmail: email,
          blogId: meta.blogId ?? null,
          actionType: meta.actionType,
          delta,
          previousScore,
          newScore,
          adminEmail: meta.adminEmail.toLowerCase().trim(),
          reason: meta.reason ?? null,
        },
      ],
      { session }
    );

    if (ownSession) {
      await session.commitTransaction();
      await session.endSession();
    }
    return { previousScore, newScore };
  } catch (err) {
    if (ownSession) {
      await session.abortTransaction();
      await session.endSession();
    }
    throw err;
  }
}

/**
 * Find user by email and return current credibility score (for admin adjust / regrade).
 */
export async function getCredibilityByEmail(userEmail: string): Promise<{ score: number } | null> {
  const user = await User.findOne({ email: userEmail.toLowerCase().trim() })
    .select('credibilityScore')
    .lean();
  if (!user) return null;
  return { score: (user as any).credibilityScore ?? 50 };
}
