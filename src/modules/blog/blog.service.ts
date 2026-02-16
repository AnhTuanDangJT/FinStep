import mongoose from 'mongoose';
import { BlogPost, IBlogPost, IAuthor, IReviewer, Like, IBlogImage } from '../posts/post.model';
import { CreateBlogInput } from './blog.validator';
import { uploadCoverImage } from '../upload/upload.service';
import { validateUploadFile } from '../upload/upload.service';
import { MAX_BLOG_IMAGES } from './upload.middleware';
import { analyzeBlogContent } from '../ai/ai.service';
import { normalizeContent } from '../../utils/content';

/**
 * Create a new blog post
 */
export const createBlog = async (
  input: CreateBlogInput,
  author: { userId: string; name: string; email: string }
): Promise<IBlogPost> => {
  // Generate slug from title
  let baseSlug = input.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (await BlogPost.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const authorSnapshot: IAuthor = {
    userId: author.userId,
    name: author.name,
    email: author.email.toLowerCase(),
  };

  const normalizedContent = normalizeContent(input.content ?? '');
  // Excerpt is optional preview only; content is stored in full (no truncation)
  const excerpt = input.excerpt?.trim()
    ? normalizeContent(input.excerpt)
    : (normalizedContent ? normalizedContent.substring(0, 200).trim() : '');

  // images: max 4 URLs; store as IBlogImage[] with order
  const imagesInput = input.images;
  const imagesArray: IBlogImage[] = Array.isArray(imagesInput) && imagesInput.length > 0
    ? imagesInput.slice(0, MAX_BLOG_IMAGES).map((url, order) => ({ url: url.trim(), order, alt: undefined }))
    : [];

  const blog = await BlogPost.create({
    title: input.title,
    slug,
    content: normalizedContent,
    excerpt: excerpt,
    category: input.category || undefined,
    tags: input.tags || [],
    coverImageUrl: input.coverImageUrl || undefined,
    images: imagesArray,
    status: 'PENDING', // So new uploads appear in admin panel for verification (admin sees PENDING only)
    authorId: author.userId,
    author: authorSnapshot,
  });

  // AI-assisted content scoring (internal; do not auto-approve)
  try {
    const analysis = await analyzeBlogContent(normalizedContent);
    blog.clarityScore = analysis.clarityScore;
    blog.originalityScore = analysis.originalityScore;
    blog.financeRelevanceScore = analysis.financeRelevanceScore;
    blog.riskFlag = analysis.riskFlag;
    await blog.save();
  } catch {
    // Fail safely: store blog without AI fields on analysis error
  }

  return blog;
};

/**
 * List public blogs (APPROVED only)
 * Comment count derived from COUNT(comments WHERE postId = ?)
 */
export const listPublicBlogs = async (options: {
  page?: number;
  limit?: number;
}): Promise<{ blogs: (IBlogPost & { commentCount: number })[]; total: number; page: number; limit: number; totalPages: number }> => {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 10, 50);
  const skip = (page - 1) * limit;

  const query = { status: 'APPROVED' };

  const [aggResult, total] = await Promise.all([
    BlogPost.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
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
    BlogPost.countDocuments(query),
  ]);

  return {
    blogs: aggResult as unknown as (IBlogPost & { commentCount: number })[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get blog by ID (author or admin only; any status)
 */
export const getBlogById = async (
  blogId: string,
  userId: string,
  isAdmin: boolean
): Promise<IBlogPost | null> => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return null;
  }
  const blog = await BlogPost.findById(new mongoose.Types.ObjectId(blogId)).lean();
  if (!blog) return null;
  const isAuthor = (blog as any).author?.userId === userId;
  if (!isAuthor && !isAdmin) return null;
  return blog as unknown as IBlogPost;
};

/**
 * List user's own blogs (any status)
 */
export const listUserBlogs = async (
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ blogs: IBlogPost[]; total: number; page: number; limit: number; totalPages: number }> => {
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 10, 50);
  const skip = (page - 1) * limit;

  const query = { 'author.userId': userId };

  const [blogs, total] = await Promise.all([
    BlogPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(query),
  ]);

  return {
    blogs: blogs as unknown as IBlogPost[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * List pending blogs (admin only)
 * Includes DRAFT and PENDING so admins see all posts awaiting verification (including drafts not yet "submitted").
 */
export const listPendingBlogs = async (options: {
  page?: number;
  limit?: number;
}): Promise<{ blogs: IBlogPost[]; total: number; page: number; limit: number; totalPages: number }> => {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 10, 50);
  const skip = (page - 1) * limit;

  const query = { status: { $in: ['DRAFT', 'PENDING'] } };

  const [blogs, total] = await Promise.all([
    BlogPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(query),
  ]);

  return {
    blogs: blogs as unknown as IBlogPost[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Submit blog for review (author only; DRAFT or REJECTED -> PENDING)
 */
export const submitBlog = async (
  blogId: string,
  userId: string
): Promise<IBlogPost | null> => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return null;
  }
  const blog = await BlogPost.findById(new mongoose.Types.ObjectId(blogId));
  if (!blog) return null;

  const isAuthor = (blog as any).author?.userId === userId;
  if (!isAuthor) {
    throw new Error('Unauthorized: Only the author can submit the post');
  }

  if (blog.status !== 'DRAFT' && blog.status !== 'REJECTED') {
    throw new Error(`Cannot submit: post is already ${blog.status}`);
  }

  blog.status = 'PENDING';
  (blog as any).rejectionReason = undefined;
  blog.reviewedBy = undefined;
  blog.reviewedAt = undefined;

  // AI-assisted content scoring on re-submission (internal; do not auto-approve)
  try {
    const analysis = await analyzeBlogContent(blog.content || '');
    blog.clarityScore = analysis.clarityScore;
    blog.originalityScore = analysis.originalityScore;
    blog.financeRelevanceScore = analysis.financeRelevanceScore;
    blog.riskFlag = analysis.riskFlag;
  } catch {
    // Fail safely
  }

  await blog.save();
  return blog;
};

/**
 * Approve blog (admin only)
 */
export const approveBlog = async (
  blogId: string,
  admin: { adminId: string; email: string }
): Promise<IBlogPost | null> => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return null;
  }
  const blog = await BlogPost.findById(new mongoose.Types.ObjectId(blogId));

  if (!blog) {
    return null;
  }
  if (blog.status !== 'PENDING') {
    throw new Error('Only pending blogs can be approved');
  }

  const reviewer: IReviewer = {
    adminId: admin.adminId,
    email: admin.email.toLowerCase(),
  };

  blog.status = 'APPROVED';
  blog.rejectionReason = undefined;
  blog.reviewedBy = reviewer;
  blog.reviewedAt = new Date();
  blog.approvedAt = new Date();

  await blog.save();
  return blog;
};

/**
 * Reject blog (admin only)
 */
export const rejectBlog = async (
  blogId: string,
  admin: { adminId: string; email: string },
  reason: string
): Promise<IBlogPost | null> => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return null;
  }
  const blog = await BlogPost.findById(new mongoose.Types.ObjectId(blogId));

  if (!blog) {
    return null;
  }
  if (blog.status !== 'PENDING') {
    throw new Error('Only pending blogs can be rejected');
  }

  const trimmedReason = reason?.trim();
  if (!trimmedReason) {
    throw new Error('Rejection reason is required when rejecting a blog');
  }

  const reviewer: IReviewer = {
    adminId: admin.adminId,
    email: admin.email.toLowerCase(),
  };

  blog.status = 'REJECTED';
  (blog as any).rejectionReason = trimmedReason;
  blog.reviewedBy = reviewer;
  blog.reviewedAt = new Date();

  await blog.save();
  return blog;
};

/**
 * Toggle like on blog (authenticated users)
 * Only APPROVED posts can be liked
 * Uses Like model for unique constraint (postId + userId)
 */
export const toggleLikeBlog = async (
  blogId: string,
  userId: string
): Promise<{ blog: IBlogPost; liked: boolean } | null> => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return null;
  }
  const blog = await BlogPost.findById(new mongoose.Types.ObjectId(blogId));

  if (!blog) {
    return null;
  }
  if (blog.status !== 'APPROVED') {
    throw new Error('Only approved posts can be liked');
  }

  const objId = new mongoose.Types.ObjectId(blogId);
  const existingLike = await Like.findOne({ postId: objId, userId });

  let liked: boolean;
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    blog.likes = Math.max(0, (blog.likes || 0) - 1);
    liked = false;
  } else {
    await Like.create({ postId: objId, userId });
    blog.likes = (blog.likes || 0) + 1;
    liked = true;
  }

  const likedBy = (blog.likedBy as string[]) || [];
  if (liked) {
    if (!likedBy.includes(userId)) likedBy.push(userId);
  } else {
    const idx = likedBy.indexOf(userId);
    if (idx >= 0) likedBy.splice(idx, 1);
  }
  blog.likedBy = likedBy;
  await blog.save();

  return { blog, liked };
};

/**
 * Add images to a blog (author or admin only).
 * Uploads files to storage (S3/Cloudinary/local), appends to blog.images with order, returns updated list.
 */
export const addBlogImages = async (
  blogId: string,
  userId: string,
  isAdmin: boolean,
  files: Express.Multer.File[]
): Promise<{ images: Array<{ id: string; url: string; order: number; alt?: string }> } | null> => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return null;
  }
  const blog = await BlogPost.findById(new mongoose.Types.ObjectId(blogId));
  if (!blog) return null;

  const isAuthor = (blog as any).author?.userId === userId;
  if (!isAuthor && !isAdmin) {
    throw new Error('Unauthorized: Only the author or admin can add images');
  }

  const currentImages = (blog.images as IBlogImage[]) || [];
  const totalAfter = currentImages.length + files.length;
  if (totalAfter > MAX_BLOG_IMAGES) {
    throw new Error(
      `Maximum ${MAX_BLOG_IMAGES} images per blog. Current: ${currentImages.length}, adding: ${files.length}.`
    );
  }

  const uploaded: IBlogImage[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i] as Express.Multer.File & { buffer?: Buffer };
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }
    const result = await uploadCoverImage(file);
    const order = currentImages.length + i;
    uploaded.push({
      url: result.url,
      order,
      alt: undefined,
    });
  }

  const existingArray = Array.isArray(blog.images) ? [...blog.images] : [];
  const newImages = existingArray.concat(
    uploaded.map((img) => ({ ...img, _id: new mongoose.Types.ObjectId() }))
  );
  blog.images = newImages;
  await blog.save();

  const list = (blog.images as IBlogImage[]).map((img, idx) => ({
    id: (img as any)._id?.toString?.() ?? String(idx),
    url: img.url,
    order: img.order,
    alt: img.alt,
  }));
  return { images: list };
};

