import { BlogPost, IBlogPost, PostStatus, IAuthor, IReviewer, Comment, IComment, Like, PostUpdate, IPostUpdate } from './post.model';
import { CreatePostInput, UpdatePostInput } from './post.validator';
import { touchLastActive } from '../profile/profile.service';
import { getAbsoluteUploadUrl } from '../../config/env';
import mongoose from 'mongoose';

/**
 * Generate a unique slug from title
 * Handles collisions by appending a number
 */
export const generateSlug = async (title: string): Promise<string> => {
  // Create base slug: lowercase, replace spaces with hyphens, remove special chars
  let baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Check if slug exists
  let slug = baseSlug;
  let counter = 1;

  while (await BlogPost.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Create a new blog post
 */
export const createPost = async (
  input: CreatePostInput,
  author: { userId: string; name: string; email: string }
): Promise<IBlogPost> => {
  const slug = await generateSlug(input.title);

  const authorSnapshot: IAuthor = {
    userId: author.userId,
    name: author.name,
    email: author.email.toLowerCase(),
  };

  // Excerpt is optional preview only; content is stored in full (no truncation)
  const excerpt =
    (input.excerpt && input.excerpt.trim()) || (input.content ? input.content.substring(0, 200).trim() : '') || '';

  // Normalize images: accept string[] or { url, order? }[], max 4
  const rawImages = input.images ?? [];
  const imagesNormalized = rawImages.slice(0, 4).map((item, index) => {
    if (typeof item === 'string') {
      return { url: item.trim(), order: index };
    }
    return { url: (item as { url: string }).url?.trim() ?? '', order: (item as { order?: number }).order ?? index };
  }).filter((img) => img.url.length > 0);
  const firstImageUrl = imagesNormalized[0]?.url;
  const coverImageUrl = input.coverImageUrl?.trim() || firstImageUrl || undefined;

  const post = await BlogPost.create({
    title: input.title,
    slug,
    content: input.content,
    excerpt,
    tags: input.tags || [],
    category: input.category || undefined,
    coverImageUrl,
    images: imagesNormalized,
    status: 'PENDING', // New posts go to admin Pending for approval (per BACKEND_SANITY_CHECKLIST)
    authorId: author.userId,
    author: authorSnapshot,
    journeyId: input.journeyId ? new mongoose.Types.ObjectId(input.journeyId) : undefined,
    stepNumber: input.stepNumber ?? undefined,
    experienceLevel: input.experienceLevel || undefined,
    summary: input.summary?.trim() || undefined,
  });

  await touchLastActive(author.userId).catch(() => {});
  return post;
};

/**
 * Get post by slug (public - only APPROVED)
 */
export const getPostBySlug = async (slug: string): Promise<IBlogPost | null> => {
  return BlogPost.findOne({ slug, status: 'APPROVED' });
};

/**
 * Check if string is a valid MongoDB ObjectId (24 hex chars)
 */
export const isObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string' || id.trim().length !== 24) return false;
  return /^[0-9a-fA-F]{24}$/.test(id.trim());
};

/**
 * Get post by ID or slug (any status).
 * - If identifier looks like ObjectId (24 hex) → find by _id.
 * - Otherwise → find by slug (case-insensitive via lowercase).
 * Used for GET single post/blog so both /blog/emergency-fund-basics and /blog/:id work.
 */
export const getPostByIdOrSlug = async (identifier: string): Promise<IBlogPost | null> => {
  const trimmed = identifier?.trim();
  if (!trimmed) return null;
  if (isObjectId(trimmed)) {
    const doc = await BlogPost.findById(new mongoose.Types.ObjectId(trimmed)).lean();
    return doc as unknown as IBlogPost | null;
  }
  const doc = await BlogPost.findOne({ slug: trimmed.toLowerCase() }).lean();
  return doc as unknown as IBlogPost | null;
};

/**
 * Get post by ID (for author/admin)
 * Uses explicit ObjectId casting to prevent NoSQL injection
 */
export const getPostById = async (postId: string): Promise<IBlogPost | null> => {
  // Validate ObjectId format and cast explicitly
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return null;
  }
  return BlogPost.findById(new mongoose.Types.ObjectId(postId));
};

/**
 * List posts with filters (public - only APPROVED)
 * Includes likes count, comment count, author name/email, coverImageUrl
 * Supports ?search ?category ?tag ?tags=tag1,tag2 ?sort=newest|oldest|popular
 */
export const listPublicPosts = async (options: {
  tag?: string;
  tags?: string[]; // multiple tags (match any)
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ posts: (IBlogPost & { commentCount?: number })[]; total: number; page: number; limit: number; totalPages: number }> => {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 10, 50); // Max 50 per page
  const skip = (page - 1) * limit;

  const matchQuery: Record<string, unknown> = { status: 'APPROVED' };

  if (options.tags && options.tags.length > 0) {
    const tagList = options.tags.map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      matchQuery.tags = { $in: tagList.map((t) => new RegExp(`^${escapeRegex(t)}$`, 'i')) };
    }
  } else if (options.tag) {
    matchQuery.tags = new RegExp(`^${escapeRegex(options.tag.trim())}$`, 'i');
  }
  if (options.category) {
    matchQuery.category = options.category;
  }
  if (options.search && options.search.trim()) {
    const term = options.search.trim();
    matchQuery.$or = [
      { title: { $regex: term, $options: 'i' } },
      { summary: { $regex: term, $options: 'i' } },
      { content: { $regex: term, $options: 'i' } },
      { excerpt: { $regex: term, $options: 'i' } },
    ];
  }

  let sortField: Record<string, 1 | -1>;
  if (options.sort === 'popular') {
    sortField = { likes: -1, createdAt: -1 };
  } else if (options.sort === 'oldest') {
    sortField = { createdAt: 1 };
  } else {
    sortField = { createdAt: -1 }; // newest (default)
  }

  const [aggResult, total] = await Promise.all([
    BlogPost.aggregate([
      { $match: matchQuery },
      { $sort: sortField },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'commentDocs',
        },
      },
      {
        $addFields: {
          commentCount: { $size: '$commentDocs' },
        },
      },
      { $project: { commentDocs: 0 } },
    ]),
    BlogPost.countDocuments(matchQuery),
  ]);

  return {
    posts: aggResult as (IBlogPost & { commentCount: number })[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * List user's own posts (any status)
 */
export const listUserPosts = async (
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ posts: IBlogPost[]; total: number; page: number; limit: number; totalPages: number }> => {
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 10, 50);
  const skip = (page - 1) * limit;

  const query = { 'author.userId': userId };

  const [posts, total] = await Promise.all([
    BlogPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(query),
  ]);

  return {
    posts: posts as unknown as IBlogPost[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Add an update to an APPROVED post (author only). Immutable history.
 */
export const addPostUpdate = async (
  postId: string,
  userId: string,
  updateNote: string
): Promise<IPostUpdate | null> => {
  if (!mongoose.Types.ObjectId.isValid(postId)) return null;
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId));
  if (!post || post.status !== 'APPROVED') return null;
  if (post.author?.userId !== userId) {
    throw new Error('Unauthorized: Only the author can add updates');
  }
  const update = await PostUpdate.create({
    postId: new mongoose.Types.ObjectId(postId),
    updateNote: updateNote.trim(),
  });
  return update;
};

/**
 * List updates for a post (public for APPROVED posts only).
 */
export const listPostUpdates = async (
  postId: string,
  options?: { page?: number; limit?: number }
): Promise<{ updates: IPostUpdate[]; total: number; page: number; limit: number; totalPages: number }> => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return { updates: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId)).select('status').lean();
  if (!post || post.status !== 'APPROVED') {
    return { updates: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }
  const page = options?.page ?? 1;
  const limit = Math.min(options?.limit ?? 20, 50);
  const skip = (page - 1) * limit;
  const [updates, total] = await Promise.all([
    PostUpdate.find({ postId: new mongoose.Types.ObjectId(postId) })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PostUpdate.countDocuments({ postId: new mongoose.Types.ObjectId(postId) }),
  ]);
  return {
    updates: updates as unknown as IPostUpdate[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Update post (author or admin; PENDING, APPROVED, or REJECTED)
 * Uses explicit ObjectId casting to prevent NoSQL injection
 * Ownership: author.userId === userId OR user has ADMIN role
 */
export const updatePost = async (
  postId: string,
  userId: string,
  input: Partial<UpdatePostInput>,
  isAdmin: boolean = false
): Promise<IBlogPost | null> => {
  // Validate ObjectId format and cast explicitly
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return null;
  }
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId));

  if (!post) {
    return null;
  }

  // Authorization: user can ONLY edit if they are author OR admin (critical: use && not ||)
  const isAuthor = post.author?.userId === userId;
  if (!isAuthor && !isAdmin) {
    throw new Error('Unauthorized: You can only edit your own posts');
  }

  // Business rule: User CAN edit PENDING, APPROVED, and REJECTED posts (admin can edit any)

  // Generate new slug if title changed
  if (input.title && input.title !== post.title) {
    post.slug = await generateSlug(input.title);
    post.title = input.title;
  }

  // Update other fields
  if (input.content !== undefined) {
    post.content = input.content;
  }
  if (input.excerpt !== undefined) {
    post.excerpt = input.excerpt;
  }
  if (input.tags !== undefined) {
    post.tags = input.tags;
  }
  if (input.coverImageUrl !== undefined) {
    post.coverImageUrl = input.coverImageUrl || undefined;
  }
  if (input.images !== undefined) {
    const arr = Array.isArray(input.images) ? input.images.slice(0, 4) : [];
    post.images = arr.map((url, order) => ({ url: String(url).trim(), order, alt: undefined }));
  }
  if (input.category !== undefined) {
    post.category = input.category || undefined;
  }
  if (input.journeyId !== undefined) {
    post.journeyId = input.journeyId ? new mongoose.Types.ObjectId(input.journeyId) : undefined;
  }
  if (input.stepNumber !== undefined) {
    post.stepNumber = input.stepNumber ?? undefined;
  }
  if (input.experienceLevel !== undefined) {
    post.experienceLevel = input.experienceLevel || undefined;
  }
  if (input.summary !== undefined) {
    post.summary = input.summary?.trim() || undefined;
  }
  if (input.paragraphMeta !== undefined) {
    // Normalize: map title -> aiTitle (AI output uses title; model uses aiTitle)
    post.paragraphMeta = {
      paragraphs: input.paragraphMeta.paragraphs.map((p: { index: number; aiTitle?: string | null; title?: string | null; suggestedFormat?: string }) => ({
        index: p.index,
        aiTitle: p.aiTitle ?? p.title ?? null,
        suggestedFormat: (p.suggestedFormat === 'bullet' ? 'bullet' : 'paragraph') as 'paragraph' | 'bullet',
      })),
    };
  }
  if (input.aiFeaturesEnabled !== undefined) {
    post.aiFeaturesEnabled = input.aiFeaturesEnabled;
  }

  // Audit: do NOT clear rejectionReason on author edit; author must use submitPost to re-submit

  await post.save();
  return post;
};

/**
 * Submit post for review (author only; DRAFT or REJECTED -> PENDING)
 */
export const submitPost = async (
  postId: string,
  userId: string
): Promise<IBlogPost | null> => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return null;
  }
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId));
  if (!post) return null;

  const isAuthor = post.author?.userId === userId;
  if (!isAuthor) {
    throw new Error('Unauthorized: Only the author can submit the post');
  }

  if (post.status !== 'DRAFT' && post.status !== 'REJECTED') {
    throw new Error(`Cannot submit: post is already ${post.status}`);
  }

  post.status = 'PENDING';
  post.rejectionReason = undefined;
  post.reviewedBy = undefined;
  post.reviewedAt = undefined;
  await post.save();
  return post;
};

/**
 * Delete post (author or admin; DRAFT/REJECTED by author; any by admin)
 * Uses explicit ObjectId casting to prevent NoSQL injection
 * Ownership: author.userId === userId OR user has ADMIN role
 */
export const deletePost = async (
  postId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<boolean> => {
  // Validate ObjectId format and cast explicitly
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return false;
  }
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId));

  if (!post) {
    return false;
  }

  // Authorization: user can ONLY delete if they are author OR admin (critical: use && not ||)
  const isAuthor = post.author?.userId === userId;
  if (!isAuthor && !isAdmin) {
    throw new Error('Unauthorized: You can only delete your own posts');
  }

  // Business rule: Author can delete any of their own posts (draft, rejected, approved); admin can delete any

  await BlogPost.findByIdAndDelete(new mongoose.Types.ObjectId(postId));
  return true;
};

/**
 * Approve post (admin only)
 * Uses explicit ObjectId casting to prevent NoSQL injection
 */
export const approvePost = async (
  postId: string,
  admin: { adminId: string; email: string }
): Promise<IBlogPost | null> => {
  // Validate ObjectId format and cast explicitly
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return null;
  }
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId));

  if (!post) {
    return null;
  }
  if (post.status !== 'PENDING') {
    throw new Error('Only pending posts can be approved');
  }

  const reviewer: IReviewer = {
    adminId: admin.adminId,
    email: admin.email.toLowerCase(),
  };

  post.status = 'APPROVED';
  post.rejectionReason = undefined;
  post.reviewedBy = reviewer;
  post.reviewedAt = new Date();
  post.approvedAt = new Date();

  await post.save();
  return post;
};

/**
 * Reject post (admin only)
 * Uses explicit ObjectId casting to prevent NoSQL injection
 */
export const rejectPost = async (
  postId: string,
  admin: { adminId: string; email: string },
  reason: string
): Promise<IBlogPost | null> => {
  // Validate ObjectId format and cast explicitly
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return null;
  }
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId));

  if (!post) {
    return null;
  }
  if (post.status !== 'PENDING') {
    throw new Error('Only pending posts can be rejected');
  }

  const reviewer: IReviewer = {
    adminId: admin.adminId,
    email: admin.email.toLowerCase(),
  };

  const trimmedReason = reason?.trim();
  if (!trimmedReason) {
    throw new Error('Rejection reason is required when rejecting a blog');
  }

  post.status = 'REJECTED';
  post.rejectionReason = trimmedReason;
  post.reviewedBy = reviewer;
  post.reviewedAt = new Date();

  await post.save();
  return post;
};

/**
 * Admin review: set status to APPROVED or REJECTED (admin only).
 * REJECTED requires rejectionReason; APPROVED clears rejectionReason.
 * Returns updated blog with id, status, rejectionReason, reviewedAt, reviewedBy.
 */
export const reviewPost = async (
  postId: string,
  admin: { adminId: string; email: string },
  payload: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
): Promise<IBlogPost | null> => {
  if (payload.status === 'REJECTED') {
    const reason = payload.rejectionReason?.trim();
    if (!reason) {
      throw new Error('Rejection reason is required when status is REJECTED');
    }
    return rejectPost(postId, admin, reason);
  }
  return approvePost(postId, admin);
};

/**
 * Toggle like on post (authenticated users)
 * Only APPROVED posts can be liked
 * Uses Like model for unique constraint (postId + userId)
 * @param unlikeOnly - if true, only remove like (for DELETE /posts/:id/like)
 */
export const toggleLikePost = async (
  postId: string,
  userId: string,
  unlikeOnly: boolean = false
): Promise<{ post: IBlogPost; liked: boolean } | null> => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return null;
  }
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId));
  if (!post) return null;
  if (post.status !== 'APPROVED') {
    throw new Error('Only approved posts can be liked');
  }

  const objId = new mongoose.Types.ObjectId(postId);
  const existingLike = await Like.findOne({ postId: objId, userId });

  if (unlikeOnly && !existingLike) {
    return { post, liked: false };
  }

  let liked: boolean;
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    post.likes = Math.max(0, (post.likes || 0) - 1);
    liked = false;
  } else {
    if (unlikeOnly) {
      return { post, liked: false };
    }
    await Like.create({ postId: objId, userId });
    post.likes = (post.likes || 0) + 1;
    liked = true;
  }
  // Sync likedBy for backward compatibility (optional; can be removed later)
  const likedBy = (post.likedBy as string[]) || [];
  if (liked) {
    if (!likedBy.includes(userId)) likedBy.push(userId);
  } else {
    const idx = likedBy.indexOf(userId);
    if (idx >= 0) likedBy.splice(idx, 1);
  }
  post.likedBy = likedBy;
  await post.save();
  return { post, liked };
};

/**
 * Get comment count for a post (source of truth: COUNT(comments WHERE postId = ?))
 */
export const getCommentCountByPostId = async (postId: string): Promise<number> => {
  if (!mongoose.Types.ObjectId.isValid(postId)) return 0;
  return Comment.countDocuments({ postId: new mongoose.Types.ObjectId(postId) });
};

/**
 * Add comment on post (authenticated or guest; post must be APPROVED)
 * @param authorId - User ObjectId when authenticated; undefined for guests
 * @param authorName - Display name (from User when auth, or "Guest" for guests)
 */
export const addComment = async (
  postId: string,
  content: string,
  authorId?: mongoose.Types.ObjectId,
  authorName?: string
): Promise<IComment | null> => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return null;
  }
  const post = await BlogPost.findById(new mongoose.Types.ObjectId(postId));
  if (!post) return null;
  if (post.status !== 'APPROVED') {
    throw new Error('Only approved posts can be commented on');
  }

  const comment = await Comment.create({
    postId: new mongoose.Types.ObjectId(postId),
    authorId: authorId || undefined,
    authorName: (authorName || 'Guest').trim(),
    content: content.trim(),
  });
  return comment;
};

/**
 * List comments for a post (public for approved post)
 * Returns comments with populated author: { id, name, avatar }
 * Comment count is derived from COUNT(comments WHERE postId = ?)
 */
export const listCommentsByPostId = async (
  postId: string,
  options?: { page?: number; limit?: number }
): Promise<{
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: { name: string; avatar?: string | null };
  }>;
  total: number;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return { comments: [], total: 0, totalCount: 0, page: 1, limit: 20, totalPages: 0 };
  }
  const postObjId = new mongoose.Types.ObjectId(postId);
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 20, 50);
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ postId: postObjId })
      .populate('authorId', 'name avatarUrl')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments({ postId: postObjId }),
  ]);

  const mappedComments = comments.map((c: any) => {
    const authorIdPop = c.authorId;
    const name =
      authorIdPop?.name ?? c.authorName ?? 'Unknown';
    const avatar =
      authorIdPop?.avatarUrl != null
        ? getAbsoluteUploadUrl(authorIdPop.avatarUrl)
        : undefined;
    const id = c._id?.toString() ?? c.id;
    return {
      id,
      content: c.content,
      createdAt: c.createdAt,
      author: {
        name,
        avatar: avatar ?? null,
        // Never expose author internal id in public responses
      },
    };
  });

  return {
    comments: mappedComments,
    total,
    totalCount: total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Recommended posts (rule-based: goal, careerStage, experienceLevel)
 * Only APPROVED posts. Optional filters: journeyGoal, careerStage, experienceLevel.
 */
export const listRecommendedPosts = async (options: {
  journeyGoal?: string;
  careerStage?: string;
  experienceLevel?: string;
  limit?: number;
}): Promise<IBlogPost[]> => {
  const limit = Math.min(options.limit ?? 10, 30);
  const query: Record<string, unknown> = { status: 'APPROVED' };
  const orParts: Record<string, unknown>[] = [];
  if (options.experienceLevel) {
    orParts.push({ experienceLevel: options.experienceLevel });
  }
  if (options.journeyGoal) {
    const { Journey } = await import('../journey/journey.model');
    const journeyIds = await Journey.find({ goal: options.journeyGoal }).distinct('_id');
    if (journeyIds.length) orParts.push({ journeyId: { $in: journeyIds } });
  }
  if (options.careerStage) {
    const { Journey } = await import('../journey/journey.model');
    const { User } = await import('../auth/auth.model');
    const userIds = await User.find({ careerStage: options.careerStage }).distinct('_id');
    const idStrings = userIds.map((id) => id.toString());
    if (idStrings.length) {
      const journeyIds = await Journey.find({ userId: { $in: idStrings } }).distinct('_id');
      if (journeyIds.length) orParts.push({ journeyId: { $in: journeyIds } });
    }
  }
  if (orParts.length) query.$or = orParts;
  const posts = await BlogPost.find(query).sort({ approvedAt: -1, createdAt: -1 }).limit(limit).lean();
  return posts as unknown as IBlogPost[];
};

/**
 * List posts for admin (with status filter; DRAFT, PENDING, APPROVED, REJECTED)
 */
export const listAdminPosts = async (options: {
  status?: PostStatus | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  page?: number;
  limit?: number;
}): Promise<{ posts: IBlogPost[]; total: number; page: number; limit: number; totalPages: number }> => {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 10, 50);
  const skip = (page - 1) * limit;

  const query: Record<string, string> = {};
  if (options.status) {
    query.status = options.status;
  }

  const [posts, total] = await Promise.all([
    BlogPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(query),
  ]);

  return {
    posts: posts as unknown as IBlogPost[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

