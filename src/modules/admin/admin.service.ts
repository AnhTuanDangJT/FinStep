import mongoose from 'mongoose';
import { User } from '../auth/auth.model';
import { BlogPost } from '../posts/post.model';
import { AdminNote } from './admin.note.model';
import { AuditLog } from './admin.audit.model';
import { CredibilityHistory } from './credibility.model';
import { applyDelta, gradeToDelta, gradeToLabel } from './credibility.service';
import { AddAdminInput } from './admin.validator';
import type { CredibilityLevel } from '../auth/auth.model';
import { maskEmail } from '../../utils/serializers';

/**
 * Record an admin action (immutable audit log)
 */
export const createAuditLog = async (params: {
  actionType: string;
  targetId: string | null;
  performedBy: string;
  performedByEmail: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  try {
    await AuditLog.create({
      actionType: params.actionType,
      targetId: params.targetId ?? null,
      performedBy: params.performedBy,
      performedByEmail: params.performedByEmail.toLowerCase(),
      timestamp: new Date(),
      metadata: params.metadata || {},
    });
  } catch (err) {
    // Log but do not fail the request
    const { logger } = await import('../../utils/logger');
    logger.error('Audit log write failed', err instanceof Error ? err : undefined);
  }
};

/**
 * Admin overview counts (safe aggregation for dashboard refresh).
 * Each count is guarded; failures default to 0 so one failing query cannot crash the endpoint.
 */
export const getAdminOverviewCounts = async (): Promise<{
  pendingCount: number;
  approvedCount: number;
  usersCount: number;
}> => {
  let pendingCount = 0;
  let approvedCount = 0;
  let usersCount = 0;

  try {
    pendingCount = await BlogPost.countDocuments({ status: 'PENDING' });
  } catch (e) {
    const { logger } = await import('../../utils/logger');
    logger.error('Admin overview: pending count failed', e instanceof Error ? e : undefined);
  }

  try {
    approvedCount = await BlogPost.countDocuments({ status: 'APPROVED' });
  } catch (e) {
    const { logger } = await import('../../utils/logger');
    logger.error('Admin overview: approved count failed', e instanceof Error ? e : undefined);
  }

  try {
    usersCount = await User.countDocuments({});
  } catch (e) {
    const { logger } = await import('../../utils/logger');
    logger.error('Admin overview: users count failed', e instanceof Error ? e : undefined);
  }

  return { pendingCount, approvedCount, usersCount };
};

/**
 * List all users (admin only) with credibility, rejection count, soft-ban
 */
export const listAllUsers = async (options?: {
  page?: number;
  limit?: number;
}): Promise<{
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    roles: string[];
    linkedInUrl?: string;
    createdAt: Date;
    credibilityLevel: string;
    rejectionCount: number;
    isSoftBanned: boolean;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 10, 50);
  const skip = (page - 1) * limit;

  const [users, total, rejectionCounts] = await Promise.all([
    User.find({})
      .select('publicId name email linkedInUrl roles createdAt role credibilityLevel credibilityScore isSoftBanned isSuspended')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({}),
    BlogPost.aggregate([
      { $match: { status: 'REJECTED' } },
      { $group: { _id: '$author.userId', count: { $sum: 1 } } },
    ]).then((rows) => new Map(rows.map((r: { _id: string; count: number }) => [r._id, r.count]))),
  ]);

  return {
    users: (users as any[]).map((user) => ({
      id: user.publicId || (user._id && (user._id as any).toString?.()) || '',
      publicId: user.publicId || (user._id && (user._id as any).toString?.()),
      name: user.name,
      email: user.email,
      emailMasked: maskEmail(user.email || ''),
      linkedInUrl: user.linkedInUrl || '',
      role: user.roles?.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' : user.roles?.includes('ADMIN') ? 'ADMIN' : 'USER',
      roles: user.roles || ['USER'],
      createdAt: user.createdAt,
      credibilityLevel: user.credibilityLevel || 'beginner',
      credibilityScore: user.credibilityScore ?? 50,
      rejectionCount: rejectionCounts.get(user._id?.toString?.() ?? '') ?? 0,
      isSoftBanned: !!user.isSoftBanned,
      isSuspended: !!(user as any).isSuspended,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/** Map credibility level to numeric score (0-100) for display */
const CREDIBILITY_SCORE_MAP: Record<string, number> = {
  beginner: 0,
  contributor: 33,
  trusted_writer: 66,
  mentor: 100,
};

export interface AdminUserDetailDto {
  publicId: string;
  displayName: string;
  name: string;
  emailMasked: string;
  avatarUrl?: string;
  role: string;
  credibility: { level: string; score: number };
  createdAt: Date;
  blogStats: { approved: number; rejected: number; pending: number };
  status: 'active' | 'soft-banned';
}

/** Mongo ObjectId format - 24 hex chars */
const MONGO_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Get user detail by publicId or _id (admin only).
 * Accepts both for compatibility with frontend passing id; response never exposes _id.
 */
export const getUserDetailByPublicId = async (publicId: string): Promise<AdminUserDetailDto | null> => {
  const id = publicId.trim();
  const query = MONGO_OBJECTID_REGEX.test(id)
    ? { _id: new mongoose.Types.ObjectId(id) }
    : { publicId: id };
  const user = await User.findOne(query)
    .select('publicId name displayName email avatarUrl roles role credibilityLevel isSoftBanned createdAt')
    .lean();

  if (!user) return null;

  const userId = (user as any)._id?.toString();
  if (!userId) return null;

  const [approved, rejected, pending] = await Promise.all([
    BlogPost.countDocuments({ 'author.userId': userId, status: 'APPROVED' }),
    BlogPost.countDocuments({ 'author.userId': userId, status: 'REJECTED' }),
    BlogPost.countDocuments({ 'author.userId': userId, status: 'PENDING' }),
  ]);

  const level = (user as any).credibilityLevel || 'beginner';
  const displayName = ((user as any).displayName || (user as any).name || 'User').trim() || 'User';
  return {
    publicId: (user as any).publicId || id,
    displayName,
    name: (user as any).name || displayName,
    emailMasked: maskEmail((user as any).email || ''),
    avatarUrl: (user as any).avatarUrl || undefined,
    role: (user as any).roles?.includes('ADMIN') ? 'ADMIN' : 'USER',
    credibility: { level, score: CREDIBILITY_SCORE_MAP[level] ?? 0 },
    createdAt: (user as any).createdAt,
    blogStats: { approved, rejected, pending },
    status: (user as any).isSoftBanned ? 'soft-banned' : 'active',
  };
};

/**
 * Get all posts by author (admin only). publicId can be user's publicId or _id.
 * Returns posts with grade info for admin "Posts & grades" view.
 */
export const getPostsByAuthorPublicId = async (
  publicId: string
): Promise<Array<{ _id: string; title: string; status: string; grade?: number; gradeLabel?: string; gradedAt?: Date; createdAt: Date }>> => {
  const id = publicId.trim();
  const query = MONGO_OBJECTID_REGEX.test(id)
    ? { _id: new mongoose.Types.ObjectId(id) }
    : { publicId: id };
  const user = await User.findOne(query).select('_id').lean();
  if (!user) return [];
  const userId = (user as any)._id?.toString();
  if (!userId) return [];
  const posts = await BlogPost.find({ 'author.userId': userId })
    .sort({ createdAt: -1 })
    .select('title status grade gradeLabel gradedAt createdAt')
    .lean();
  return (posts as any[]).map((p) => ({
    _id: p._id?.toString?.() ?? '',
    title: p.title ?? '',
    status: p.status ?? 'DRAFT',
    grade: p.grade,
    gradeLabel: p.gradeLabel,
    gradedAt: p.gradedAt,
    createdAt: p.createdAt ?? new Date(),
  }));
};

/**
 * Add admin role to existing user (super admin only).
 * Sets role='admin', adminAddedBy, adminAddedAt.
 */
export const addAdminRole = async (
  input: AddAdminInput,
  addedBy: { userId: string }
): Promise<{ success: boolean; message: string }> => {
  const user = await User.findOne({ email: input.email });

  if (!user) {
    throw new Error('User not found. User must exist before being promoted to admin.');
  }

  if (user.roles && user.roles.includes('ADMIN')) {
    throw new Error('User is already an admin');
  }

  if (!user.roles) user.roles = ['USER'];
  if (!user.roles.includes('ADMIN')) user.roles.push('ADMIN');

  user.role = 'admin';
  user.adminAddedBy = new mongoose.Types.ObjectId(addedBy.userId);
  user.adminAddedAt = new Date();
  // Spec: Admin credibility ≥90
  const currentScore = (user as any).credibilityScore ?? 50;
  (user as any).credibilityScore = Math.max(currentScore, 90);
  await user.save();

  return {
    success: true,
    message: `User ${input.email} has been promoted to admin`,
  };
};

/**
 * Remove admin role (super admin only).
 */
export const removeAdminRole = async (email: string): Promise<{ success: boolean; message: string }> => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new Error('User not found.');
  }
  if (!user.roles || !user.roles.includes('ADMIN')) {
    throw new Error('User is not an admin.');
  }
  if (user.email === 'dganhtuan.2k5@gmail.com') {
    throw new Error('Cannot remove super admin.');
  }
  user.roles = (user.roles || []).filter((r) => r !== 'ADMIN');
  user.role = 'user';
  user.adminAddedBy = undefined;
  user.adminAddedAt = undefined;
  await user.save();
  return { success: true, message: `Admin role removed from ${user.email}` };
};

/**
 * Soft-ban user: can submit blogs but they always go to PENDING (no notification)
 */
export const softBanUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');
  user.isSoftBanned = true;
  await user.save();
  return { success: true, message: `User ${user.email} has been soft-banned` };
};

/**
 * Suspend user (spec: violations → set to 0 + suspend). Sets isSuspended and optionally applies credibility delta to 0 (audited).
 */
export const suspendUser = async (
  userId: string,
  options?: { setCredibilityToZero?: boolean; adminEmail?: string }
): Promise<{ success: boolean; message: string }> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');
  if (user.email === 'dganhtuan.2k5@gmail.com') throw new Error('Cannot suspend super admin.');
  (user as any).isSuspended = true;
  user.isSoftBanned = true;
  if (options?.setCredibilityToZero && options?.adminEmail) {
    const current = (user as any).credibilityScore ?? 50;
    if (current !== 0) {
      try {
        await applyDelta(user.email, -current, {
          actionType: 'SUSPEND',
          blogId: null,
          adminEmail: options.adminEmail,
          reason: 'Suspension',
        });
      } catch {
        // fallback: set locally
      }
    }
    (user as any).credibilityScore = 0;
  } else if (options?.setCredibilityToZero) {
    (user as any).credibilityScore = 0;
  }
  await user.save();
  return { success: true, message: `User ${user.email} has been suspended` };
};

/**
 * Unsuspend user
 */
export const unsuspendUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');
  (user as any).isSuspended = false;
  user.isSoftBanned = false;
  await user.save();
  return { success: true, message: `Suspension removed for ${user.email}` };
};

/**
 * Remove soft-ban
 */
export const unsoftBanUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');
  user.isSoftBanned = false;
  await user.save();
  return { success: true, message: `Soft-ban removed for ${user.email}` };
};

/**
 * Set user credibility (admin override). Supports level and/or numeric score 0–100.
 */
export const setUserCredibility = async (
  userId: string,
  level: CredibilityLevel,
  updatedBy: string,
  scoreOverride?: number
): Promise<{ success: boolean; message: string }> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');
  user.credibilityLevel = level;
  user.credibilityUpdatedBy = new mongoose.Types.ObjectId(updatedBy);
  user.credibilityUpdatedAt = new Date();
  if (scoreOverride !== undefined) {
    const score = Math.max(0, Math.min(100, scoreOverride));
    (user as any).credibilityScore = score;
  } else {
    (user as any).credibilityScore = CREDIBILITY_SCORE_MAP[level] ?? (user as any).credibilityScore ?? 50;
  }
  await user.save();
  return { success: true, message: `Credibility set to ${level}` };
};

/**
 * Adjust credibility score (0–100) manually. Spec: manual admin adjustment allowed.
 */
export const setUserCredibilityScore = async (
  userId: string,
  score: number,
  updatedBy: string
): Promise<{ success: boolean; message: string }> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');
  const clamped = Math.max(0, Math.min(100, score));
  (user as any).credibilityScore = clamped;
  user.credibilityUpdatedBy = new mongoose.Types.ObjectId(updatedBy);
  user.credibilityUpdatedAt = new Date();
  await user.save();
  return { success: true, message: `Credibility score set to ${clamped}` };
};

/**
 * Adjust credibility score by user ref (publicId or ObjectId). Records to CredibilityHistory.
 * Used by POST /admin/users/:userId/credibility (frontend manual adjustment with score + reason).
 */
export const adjustCredibilityScoreByUserRef = async (
  userRef: string,
  score: number,
  reason: string,
  adminUserId: string,
  adminEmail: string
): Promise<{ success: boolean; message: string }> => {
  const id = userRef.trim();
  const query = MONGO_OBJECTID_REGEX.test(id)
    ? { _id: new mongoose.Types.ObjectId(id) }
    : { publicId: id };
  const user = await User.findOne(query);
  if (!user) throw new Error('User not found.');
  const previousScore = (user as any).credibilityScore ?? 50;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const delta = clamped - previousScore;
  (user as any).credibilityScore = clamped;
  user.credibilityUpdatedBy = new mongoose.Types.ObjectId(adminUserId);
  user.credibilityUpdatedAt = new Date();
  await user.save();
  const email = (user as any).email?.toLowerCase?.()?.trim?.() ?? '';
  if (email) {
    await CredibilityHistory.create({
      userEmail: email,
      blogId: null,
      actionType: 'MANUAL_ADJUST',
      delta,
      previousScore,
      newScore: clamped,
      adminEmail: adminEmail.toLowerCase().trim(),
      reason: reason.trim() || null,
    });
  }
  return { success: true, message: `Credibility score set to ${clamped}` };
};

/** Blog approved → author credibility +5 (cap 100). Uses CredibilityService. */
export const addCredibilityForApprovedBlog = async (authorEmail: string, adminEmail: string, blogId: string): Promise<void> => {
  try {
    await applyDelta(authorEmail, 5, {
      actionType: 'POST_APPROVED',
      blogId,
      adminEmail,
      reason: null,
    });
  } catch {
    // Log but do not fail the request
  }
};

/** Blog rejected → author credibility -10 (floor 0). Uses CredibilityService. */
export const subtractCredibilityForRejectedBlog = async (authorEmail: string, adminEmail: string, blogId: string): Promise<void> => {
  try {
    await applyDelta(authorEmail, -10, {
      actionType: 'POST_REJECTED',
      blogId,
      adminEmail,
      reason: null,
    });
  } catch {
    // Log but do not fail the request
  }
};

/** Auto-upgrade credibility by approved blog count (only if not manually set) */
const CREDIBILITY_BY_APPROVED: Array<{ min: number; level: CredibilityLevel }> = [
  { min: 10, level: 'mentor' },
  { min: 3, level: 'trusted_writer' },
  { min: 1, level: 'contributor' },
  { min: 0, level: 'beginner' },
];

export const refreshCredibilityForAuthor = async (authorUserId: string): Promise<void> => {
  const user = await User.findById(authorUserId).select('credibilityUpdatedBy credibilityLevel');
  if (!user) return;
  if (user.credibilityUpdatedBy) return; // Admin set manually; do not override
  const approvedCount = await BlogPost.countDocuments({
    'author.userId': authorUserId,
    status: 'APPROVED',
  });
  const level = CREDIBILITY_BY_APPROVED.find((r) => approvedCount >= r.min)?.level ?? 'beginner';
  if (user.credibilityLevel !== level) {
    user.credibilityLevel = level;
    await user.save();
  }
};

/**
 * List pending blogs (status = PENDING only) for admin.
 * Returns masked author email, authorName, createdAt, title snippet; no internal ids (publicId only).
 */
export const listPendingBlogsForAdmin = async (options?: {
  page?: number;
  limit?: number;
}): Promise<{
  blogs: Array<{
    publicId: string;
    title: string;
    titleSnippet: string;
    authorName: string;
    authorEmailMasked: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 10, 50);
  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    BlogPost.find({ status: 'PENDING' })
      .select('publicId title excerpt author createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments({ status: 'PENDING' }),
  ]);
  return {
    blogs: (blogs as any[]).map((b) => ({
      publicId: b.publicId || (b._id?.toString?.() ?? ''),
      title: b.title || '',
      titleSnippet: (b.title || '').slice(0, 80) + ((b.title || '').length > 80 ? '...' : ''),
      authorName: (b.author?.name || 'Author').trim(),
      authorEmailMasked: maskEmail(b.author?.email || ''),
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * List approved blogs for admin grading tab (includes grade, gradedAt, gradeLabel so UI can show "Graded" state).
 */
export const listApprovedBlogsForAdmin = async (options?: {
  page?: number;
  limit?: number;
}): Promise<{
  blogs: Array<{
    _id: string;
    publicId: string;
    title: string;
    slug?: string;
    excerpt?: string;
    author?: { name?: string; userId?: string };
    createdAt: string;
    grade?: number;
    gradeLabel?: string;
    gradedAt?: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 50, 100);
  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    BlogPost.find({ status: 'APPROVED' })
      .select('_id publicId title slug excerpt author createdAt grade gradeLabel gradedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments({ status: 'APPROVED' }),
  ]);
  return {
    blogs: (blogs as any[]).map((b) => ({
      _id: b._id?.toString?.() ?? '',
      publicId: (b.publicId || b._id?.toString?.()) ?? '',
      title: b.title || '',
      slug: b.slug,
      excerpt: b.excerpt,
      author: b.author ? { name: b.author.name, userId: b.author.userId } : undefined,
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      grade: b.grade != null ? Number(b.grade) : undefined,
      gradeLabel: b.gradeLabel ?? undefined,
      gradedAt: b.gradedAt ? new Date(b.gradedAt).toISOString() : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Toggle blog isFeatured (admin only)
 */
export const setBlogFeatured = async (blogId: string, featured: boolean): Promise<any | null> => {
  const blog = await BlogPost.findById(blogId);
  if (!blog) return null;
  blog.isFeatured = featured;
  await blog.save();
  return blog;
};

/**
 * Toggle blog isPinned (admin only)
 */
export const setBlogPinned = async (blogId: string, pinned: boolean): Promise<any | null> => {
  const blog = await BlogPost.findById(blogId);
  if (!blog) return null;
  blog.isPinned = pinned;
  await blog.save();
  return blog;
};

/** Delta limit for non–super-admin manual adjust (e.g. -20..+20) */
const ADMIN_DELTA_LIMIT = 20;

/**
 * Grade a blog (admin only). Post must be APPROVED. Supports regrade: if already graded, reverses
 * previous credibility delta then applies the new one. Caller must validate: blog exists, APPROVED,
 * authorEmail present, author user exists.
 * Runs in one transaction. Rollback on any failure.
 */
export const gradeBlog = async (
  blogId: string,
  admin: { adminId: string; email: string },
  grade: number,
  options?: { reason?: string; regrade?: boolean }
): Promise<{ blog: any; delta: number; newCredibility: number; regraded: boolean }> => {
  const adminEmail = admin.email.toLowerCase().trim();
  const normalizedGrade = Math.max(0, Math.min(100, Math.round(grade)));
  const delta = gradeToDelta(normalizedGrade);
  const label = gradeToLabel(normalizedGrade);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const blog = await BlogPost.findById(blogId).session(session);
    if (!blog) {
      await session.abortTransaction();
      await session.endSession();
      throw new Error('Blog not found');
    }
    if ((blog as any).status !== 'APPROVED') {
      await session.abortTransaction();
      await session.endSession();
      throw new Error('Only approved blogs can be graded');
    }
    const authorEmail = (blog as any).author?.email;
    if (!authorEmail) {
      await session.abortTransaction();
      await session.endSession();
      throw new Error('Post author missing');
    }

    const alreadyGraded = (blog as any).gradedAt != null || (blog as any).grade != null;
    const oldDelta = (blog as any).credibilityDeltaApplied ?? 0;

    if (alreadyGraded && options?.regrade && oldDelta !== 0) {
      await applyDelta(
        authorEmail,
        -oldDelta,
        {
          actionType: 'REGRADE_REVERSAL',
          blogId,
          adminEmail,
          reason: options?.reason ?? 'Regrade: reverse previous',
        },
        session
      );
    }

    const { newScore: newCredibility } = await applyDelta(
      authorEmail,
      delta,
      {
        actionType: alreadyGraded && options?.regrade ? 'REGRADE_APPLIED' : 'GRADE_APPLIED',
        blogId,
        adminEmail,
        reason: options?.reason ?? null,
      },
      session
    );

    (blog as any).grade = normalizedGrade;
    (blog as any).gradeLabel = label;
    (blog as any).gradedByEmail = adminEmail;
    (blog as any).gradedAt = new Date();
    (blog as any).credibilityDeltaApplied = delta;
    await blog.save({ session });

    await session.commitTransaction();
    await session.endSession();
    return { blog, delta, newCredibility, regraded: !!(alreadyGraded && options?.regrade) };
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

/**
 * Resolve user email by userId (ObjectId) or publicId. For use when frontend sends id instead of email.
 */
export const getEmailByUserRef = async (ref: string): Promise<string | null> => {
  const id = ref?.trim();
  if (!id) return null;
  const query = MONGO_OBJECTID_REGEX.test(id)
    ? { _id: new mongoose.Types.ObjectId(id) }
    : { publicId: id };
  const user = await User.findOne(query).select('email').lean();
  return user ? (user as any).email ?? null : null;
};

/**
 * List credibility history for a user by email (admin only, paged).
 */
export const listCredibilityHistory = async (
  userEmail: string,
  options?: { page?: number; limit?: number }
): Promise<{
  items: Array<{
    id: string;
    actionType: string;
    delta: number;
    previousScore: number;
    newScore: number;
    adminEmail: string;
    reason: string | null;
    blogId: string | null;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = options?.page ?? 1;
  const limit = Math.min(options?.limit ?? 20, 100);
  const skip = (page - 1) * limit;
  const email = userEmail.toLowerCase().trim();
  const [items, total] = await Promise.all([
    CredibilityHistory.find({ userEmail: email }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CredibilityHistory.countDocuments({ userEmail: email }),
  ]);
  return {
    items: (items as any[]).map((r) => ({
      id: (r as any).id ?? '',
      actionType: (r as any).actionType ?? '',
      delta: r.delta,
      previousScore: r.previousScore,
      newScore: r.newScore,
      adminEmail: r.adminEmail,
      reason: r.reason ?? null,
      blogId: r.blogId ?? null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Adjust credibility by target email (ADMIN/SUPER_ADMIN). Delta limited to ±20 unless SUPER_ADMIN.
 */
export const adjustCredibilityByEmail = async (
  targetEmail: string,
  delta: number,
  reason: string,
  adminEmail: string,
  isSuperAdmin: boolean
): Promise<{ previousScore: number; newScore: number }> => {
  const clampedDelta = isSuperAdmin ? delta : Math.max(-ADMIN_DELTA_LIMIT, Math.min(ADMIN_DELTA_LIMIT, delta));
  return applyDelta(targetEmail.toLowerCase().trim(), clampedDelta, {
    actionType: 'MANUAL_ADJUST',
    blogId: null,
    adminEmail: adminEmail.toLowerCase().trim(),
    reason: reason?.trim() || null,
  });
};

/**
 * Promote user to admin by email (SUPER_ADMIN only). Target must exist. Sets role ADMIN and credibilityScore = max(existing, 90).
 */
export const promoteAdminByEmail = async (targetEmail: string): Promise<{ success: boolean; message: string }> => {
  const email = targetEmail.toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found. User must exist before being promoted to admin.');
  if (user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN')) {
    throw new Error('User is already an admin');
  }
  if (!user.roles) user.roles = ['USER'];
  user.roles.push('ADMIN');
  user.role = 'admin';
  user.adminAddedBy = undefined; // or set to super admin id if we had it
  user.adminAddedAt = new Date();
  const current = (user as any).credibilityScore ?? 50;
  (user as any).credibilityScore = Math.max(current, 90);
  await user.save();
  return { success: true, message: `User ${email} has been promoted to admin` };
};

/**
 * Get blog by id or slug (for admin grade flow)
 */
export const getBlogByIdOrSlugForAdmin = async (idOrSlug: string): Promise<any | null> => {
  if (mongoose.Types.ObjectId.isValid(idOrSlug) && String(idOrSlug).length === 24) {
    return BlogPost.findById(idOrSlug);
  }
  return BlogPost.findOne({ slug: idOrSlug.toLowerCase() });
};

/**
 * Get admin notes for a target (user or blog)
 */
export const getNotesForTarget = async (
  targetType: 'user' | 'blog',
  targetId: string
): Promise<{ notes: Array<{ id: string; note: string; createdBy: string; createdAt: Date }> }> => {
  const objId = mongoose.Types.ObjectId.isValid(targetId) ? new mongoose.Types.ObjectId(targetId) : null;
  if (!objId) return { notes: [] };
  const notes = await AdminNote.find({ targetType, targetId: objId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .lean();
  return {
    notes: (notes as any[]).map((n) => ({
      id: n._id.toString(),
      note: n.note,
      createdBy: n.createdBy?.email ?? n.createdBy?.toString() ?? '',
      createdAt: n.createdAt,
    })),
  };
};

/**
 * List notes with optional filter by targetType/targetId
 */
export const listNotes = async (query: {
  targetType?: 'user' | 'blog';
  targetId?: string;
}): Promise<{ notes: any[] }> => {
  const filter: any = {};
  if (query.targetType) filter.targetType = query.targetType;
  if (query.targetId && mongoose.Types.ObjectId.isValid(query.targetId)) {
    filter.targetId = new mongoose.Types.ObjectId(query.targetId);
  }
  const notes = await AdminNote.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return { notes };
};

/**
 * Add admin note (internal only)
 */
export const addNote = async (params: {
  targetType: 'user' | 'blog';
  targetId: string;
  note: string;
  createdBy: string;
}): Promise<{ id: string; note: string; createdAt: Date }> => {
  if (!params.targetId || !mongoose.Types.ObjectId.isValid(params.targetId) || String(params.targetId).trim().length !== 24) {
    throw new Error('Invalid targetId format');
  }
  const objId = new mongoose.Types.ObjectId(params.targetId);
  const doc = await AdminNote.create({
    targetType: params.targetType,
    targetId: objId,
    note: params.note.trim(),
    createdBy: new mongoose.Types.ObjectId(params.createdBy),
  });
  return {
    id: doc._id.toString(),
    note: doc.note,
    createdAt: doc.createdAt,
  };
};

/** Analytics: weekly blog stats (approved / rejected) */
async function getWeeklyBlogStats(): Promise<{
  weekStart: string;
  approved: number;
  rejected: number;
  pending: number;
}> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const [approved, rejected, pending] = await Promise.all([
    BlogPost.countDocuments({ status: 'APPROVED', reviewedAt: { $gte: weekStart } }),
    BlogPost.countDocuments({ status: 'REJECTED', reviewedAt: { $gte: weekStart } }),
    BlogPost.countDocuments({ status: 'PENDING' }),
  ]);
  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    approved,
    rejected,
    pending,
  };
}

/** Analytics: top topics (from tags/category) */
async function getTopTopics(limit: number = 10): Promise<Array<{ tag: string; count: number }>> {
  const agg = await BlogPost.aggregate([
    { $match: { status: 'APPROVED' } },
    { $unwind: '$tags' },
    { $match: { tags: { $exists: true, $ne: '' } } },
    { $group: { _id: { $toLower: '$tags' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return agg.map((r: { _id: string; count: number }) => ({ tag: r._id, count: r.count }));
}

/** Analytics: most active writers (by approved count) */
async function getMostActiveWriters(limit: number = 10): Promise<Array<{ userId: string; name: string; email: string; approvedCount: number }>> {
  const agg = await BlogPost.aggregate([
    { $match: { status: 'APPROVED' } },
    { $group: { _id: '$author.userId', name: { $first: '$author.name' }, email: { $first: '$author.email' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return agg.map((r: any) => ({
    userId: r._id,
    name: r.name || '',
    email: r.email || '',
    approvedCount: r.count,
  }));
}

/** Analytics: rejection reason breakdown */
async function getRejectionReasonBreakdown(): Promise<Array<{ reason: string; count: number }>> {
  const agg = await BlogPost.aggregate([
    { $match: { status: 'REJECTED', rejectionReason: { $exists: true, $ne: '' } } },
    { $group: { _id: '$rejectionReason', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ]);
  return agg.map((r: { _id: string; count: number }) => ({ reason: r._id, count: r.count }));
}

/**
 * Get analytics for admin dashboard
 */
export const getAnalytics = async (): Promise<{
  weeklyStats: Awaited<ReturnType<typeof getWeeklyBlogStats>>;
  topTopics: Awaited<ReturnType<typeof getTopTopics>>;
  mostActiveWriters: Awaited<ReturnType<typeof getMostActiveWriters>>;
  rejectionReasonBreakdown: Awaited<ReturnType<typeof getRejectionReasonBreakdown>>;
}> => {
  const [weeklyStats, topTopics, mostActiveWriters, rejectionReasonBreakdown] = await Promise.all([
    getWeeklyBlogStats(),
    getTopTopics(10),
    getMostActiveWriters(10),
    getRejectionReasonBreakdown(),
  ]);
  return {
    weeklyStats,
    topTopics,
    mostActiveWriters,
    rejectionReasonBreakdown,
  };
};

/**
 * Approve post (delegates to post service)
 */
export { approvePost } from '../posts/post.service';

/**
 * Reject post (delegates to post service)
 */
export { rejectPost } from '../posts/post.service';

/**
 * Admin review blog: APPROVED or REJECTED (delegates to post service)
 */
export { reviewPost } from '../posts/post.service';

/**
 * List posts for admin (delegates to post service)
 */
export { listAdminPosts } from '../posts/post.service';

/**
 * List mentors and set verified (delegate to mentor service)
 */
export { listMentorProfiles as listMentorsForAdmin, setMentorVerified } from '../mentor/mentor.service';

