import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { getAbsoluteUploadUrl, env } from '../../config/env';
import { sanitizeHtml, sanitizePublicPost } from '../../utils/security';

/** Ensure Cloudinary env is set before any upload */
function ensureCloudinaryConfig(): void {
  const name = process.env.CLOUDINARY_CLOUD_NAME ?? env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY ?? env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET ?? env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) {
    const missing = [
      !name && 'CLOUDINARY_CLOUD_NAME',
      !key && 'CLOUDINARY_API_KEY',
      !secret && 'CLOUDINARY_API_SECRET',
    ].filter(Boolean);
    throw new Error(`Cloudinary is not configured. Missing: ${missing.join(', ')}`);
  }
  cloudinary.config({
    cloud_name: name,
    api_key: key,
    api_secret: secret,
  });
}

/** Upload buffer to Cloudinary (folder: finstep-blogs). Mongo save only after this succeeds. */
function uploadToCloudinary(buffer: Buffer): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'finstep-blogs' },
      (error, result) => {
        if (error) reject(error);
        else if (result?.secure_url) resolve(result);
        else reject(new Error('Cloudinary upload failed: No URL returned'));
      }
    );
    stream.end(buffer);
  });
}
import {
  createBlog,
  listPublicBlogs,
  listUserBlogs,
  listPendingBlogs,
  submitBlog,
  approveBlog,
  rejectBlog,
  toggleLikeBlog,
  addBlogImages,
} from './blog.service';
import { updatePost, deletePost, getCommentCountByPostId } from '../posts/post.service';
import type { UpdatePostInput } from '../posts/post.validator';
import {
  createBlogSchema,
  updateBlogSchema,
  approveBlogSchema,
  rejectBlogSchema,
  likeBlogSchema,
  parseCreateBlogBody,
} from './blog.validator';
import { User } from '../auth/auth.model';
import { BlogPost } from '../posts/post.model';
import { getPostByIdOrSlug } from '../posts/post.service';
import { generateBlogSummary } from '../ai/ai.service';
import { normalizeContent } from '../../utils/content';

/** Get cached aiSummary or generate and save; returns null on AI failure (error-safe). */
async function getOrCreateAiSummary(post: { _id?: unknown; content?: string; aiSummary?: string }): Promise<string | null> {
  const postId = post?._id;
  const content = post?.content;
  if (!postId || !content || typeof content !== 'string') return null;
  const existing = (post as { aiSummary?: string }).aiSummary;
  if (existing && typeof existing === 'string' && existing.trim()) {
    return existing.trim();
  }
  try {
    const summary = await generateBlogSummary(content);
    if (!summary) return null;
    const normalizedSummary = normalizeContent(summary);
    await BlogPost.findByIdAndUpdate(postId, { aiSummary: normalizedSummary });
    return normalizedSummary;
  } catch {
    return null;
  }
}

/** Pass through only http/https URLs; no disk-based fallback. */
function withAbsoluteCoverUrl<T extends { coverImageUrl?: string; images?: Array<{ url?: string } | string> }>(
  blog: T
): T & { coverImageUrl?: string; imageUrl?: string } {
  const url = getAbsoluteUploadUrl(blog.coverImageUrl) ?? undefined;
  const images = Array.isArray(blog.images)
    ? blog.images.map((img) => {
        const raw = typeof img === 'string' ? img : img?.url;
        const absolute = getAbsoluteUploadUrl(raw) ?? '';
        return typeof img === 'string' ? absolute : { ...img, url: absolute };
      })
    : blog.images;
  return { ...blog, coverImageUrl: url, imageUrl: url, images } as T & { coverImageUrl?: string; imageUrl?: string };
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name?: string;
  };
}

/**
 * Create new blog post (authenticated users)
 * POST /blog/create
 * Accepts JSON or multipart/form-data with field "images" (max 4 files). No singular "image" field.
 */
export const createBlogHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    let body: { title: string; content: string; excerpt?: string; tags?: string[]; coverImageUrl?: string; images?: string[] };
    // Multer .fields() sets req.files to { coverImage?: File[], images?: File[] } (may be undefined on serverless if multipart wasn't parsed)
    const filesMap = (req as Request & { files?: Record<string, Express.Multer.File[]> }).files;
    const coverFiles = (filesMap?.coverImage && Array.isArray(filesMap.coverImage)) ? filesMap.coverImage : [];
    const imageFiles = (filesMap?.images && Array.isArray(filesMap.images)) ? filesMap.images : [];
    const allFiles = [...coverFiles, ...imageFiles];
    const isMultipart = (req.headers['content-type'] || '').toLowerCase().includes('multipart/form-data') ||
      (req.body && typeof req.body === 'object' && allFiles.length > 0);

    if (isMultipart && req.body && typeof req.body === 'object') {
      if (allFiles.length === 0) {
        return sendError(res, 'No file provided. Send multipart/form-data with coverImage or images.', 400);
      }
      if (allFiles.length > 4) {
        return sendError(res, 'Maximum 4 images allowed', 400);
      }
      const missingBuffer = allFiles.some((f) => !f.buffer);
      if (missingBuffer) {
        return sendError(res, 'File buffer missing. Ensure multipart field names are coverImage or images.', 400);
      }
      try {
        body = parseCreateBlogBody(req.body as Record<string, unknown>);
      } catch (parseError) {
        const errors = parseError instanceof Error ? parseError.message : 'Validation failed';
        return sendError(res, 'Validation failed', 400, errors);
      }
      // Verify Cloudinary env before upload; then upload each buffer. Mongo save only after this succeeds.
      try {
        ensureCloudinaryConfig();
      } catch (configErr) {
        const msg = configErr instanceof Error ? configErr.message : 'Image upload not configured';
        logger.error('Blog create: Cloudinary not configured', new Error(msg));
        return sendError(res, 'Image upload is not configured for this deployment. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your server environment.', 503);
      }
      const imageUrls: string[] = [];
      try {
        for (const f of allFiles) {
          const result = await uploadToCloudinary(f.buffer!);
          const imageUrl = result.secure_url;
          imageUrls.push(imageUrl);
        }
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : 'Image upload failed';
        logger.error('Blog create: Cloudinary upload failed', new Error(msg));
        return sendError(res, `Image upload failed: ${msg}. Check Cloudinary credentials and network.`, 502);
      }
      body.images = imageUrls;
      body.coverImageUrl = imageUrls[0] ?? undefined;
      logger.info('Blog create: cover/images saved to Cloudinary', { count: imageUrls.length });
    } else {
      const validationResult = createBlogSchema.safeParse(req);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
      }
      body = validationResult.data.body;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Store raw content: sanitizeHtml removes XSS vectors only; newlines (\n, \n\n) are preserved.
    const sanitizedInput = {
      ...body,
      content: sanitizeHtml(body.content),
      title: sanitizeHtml(body.title),
      images: body.images ?? [],
    };

    const author = {
      userId: req.user.userId,
      name: user.name,
      email: req.user.email,
    };

    const blog = await createBlog(sanitizedInput, author);
    const responseBlog = withAbsoluteCoverUrl(sanitizePublicPost(blog.toObject ? blog.toObject() : blog));

    logger.auth('Blog created', req.user.email, req.user.userId);
    logger.info('Blog API response', { blogId: blog._id, imagesCount: responseBlog.images?.length ?? 0 });

    return sendSuccess(res, 'Blog created successfully', { blog: responseBlog }, 201);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = err.message;
    const stack = err.stack;
    logger.error('POST /api/blogs/create – exact error', {
      message,
      stack,
      name: err.name,
    });
    if (message.includes('User not found')) return sendError(res, message, 404);
    if (message.includes('Validation') || message.includes('Maximum') || message.includes('No file') || message.includes('buffer')) return sendError(res, message, 400);
    return sendError(res, message || 'Failed to create blog', 500);
  }
};

/**
 * Get public blogs (APPROVED only)
 * GET /blog/public
 */
export const getPublicBlogsHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await listPublicBlogs({ page, limit });
    // Return FULL content (no truncation); coverImageUrl and images[].url absolute
    const blogs = result.blogs.map((b: any) => withAbsoluteCoverUrl(sanitizePublicPost(b)));
    const data = { ...result, blogs };
    return sendSuccess(res, 'Blogs retrieved successfully', data, 200);
  } catch (error) {
    logger.error('Failed to get public blogs', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve blogs', 500);
  }
};

/**
 * Get single blog by ID or slug
 * Guest: APPROVED only. Logged-in author/admin: any status.
 * GET /blog/:id  (id can be ObjectId or slug, e.g. emergency-fund-basics)
 */
export const getBlogByIdHandler = async (
  req: Request & { user?: { userId: string; email: string } },
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) {
      return sendError(res, 'Blog not found', 404);
    }

    // Public: only APPROVED posts (guest read-only)
    if (post.status === 'APPROVED') {
      const commentCount = await getCommentCountByPostId((post as any)._id?.toString?.() ?? '');
      const postWithCount = { ...post, commentCount };
      const blog = sanitizePublicPost(postWithCount);
      const aiSummary = await getOrCreateAiSummary(post);
      return sendSuccess(res, 'Blog retrieved successfully', {
        blog: withAbsoluteCoverUrl(blog),
        aiSummary: aiSummary ?? undefined,
      }, 200);
    }

    // Non-APPROVED: only author or admin can view
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'Blog not found', 404);
    }
    const user = await User.findById(userId).select('roles').lean();
    const isAdmin = !!(user?.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN'));
    const isAuthor = (post as any).author?.userId === userId;
    if (!isAuthor && !isAdmin) {
      return sendError(res, 'Blog not found', 404);
    }

    const commentCount = await getCommentCountByPostId((post as any)._id?.toString?.() ?? '');
    const postWithCount = { ...post, commentCount };
    const blog = sanitizePublicPost(postWithCount);
    const aiSummary = await getOrCreateAiSummary(post);
    return sendSuccess(res, 'Blog retrieved successfully', {
      blog: withAbsoluteCoverUrl(blog),
      aiSummary: aiSummary ?? undefined,
    }, 200);
  } catch (error) {
    logger.error('Failed to get blog', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve blog', 500);
  }
};

/**
 * Get blog by slug (public - APPROVED only)
 * GET /blog/slug/:slug
 */
export const getBlogBySlugHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findOne({ slug, status: 'APPROVED' }).lean();
    if (!post) {
      return sendError(res, 'Blog not found', 404);
    }
    const blog = withAbsoluteCoverUrl(sanitizePublicPost(post));
    const aiSummary = await getOrCreateAiSummary(post);
    return sendSuccess(res, 'Blog retrieved successfully', {
      blog,
      aiSummary: aiSummary ?? undefined,
    }, 200);
  } catch (error) {
    logger.error('Failed to get blog by slug', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve blog', 500);
  }
};

/**
 * Get shareable URL for blog
 * POST /blog/:id/share  (id can be ObjectId or slug)
 */
export const getShareUrlHandler = async (
  req: Request & { user?: { userId: string } },
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) {
      return sendError(res, 'Blog not found', 404);
    }

    // Non-APPROVED: only author or admin can get share URL
    if (post.status !== 'APPROVED') {
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(res, 'Blog not found', 404);
      }
      const user = await User.findById(userId).select('roles').lean();
      const isAdmin = !!(user?.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN'));
      const isAuthor = (post as any).author?.userId === userId;
      if (!isAuthor && !isAdmin) {
        return sendError(res, 'Blog not found', 404);
      }
    }

    const frontendUrl = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const shareUrl = `${frontendUrl}/blogs/${post._id}`;
    const shareUrlBySlug = post.slug
      ? `${frontendUrl}/posts/${post.slug}`
      : undefined;

    return sendSuccess(res, 'Share URL generated', {
      shareUrl,
      ...(shareUrlBySlug && { shareUrlBySlug }),
    }, 200);
  } catch (error) {
    logger.error('Failed to get share URL', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to get share URL', 500);
  }
};

/**
 * Get user's own blogs (any status)
 * GET /blog/me
 */
export const getMyBlogsHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await listUserBlogs(req.user.userId, { page, limit });
    const data = {
      ...result,
      blogs: (result.blogs || []).map((b) => withAbsoluteCoverUrl(b)),
    };
    return sendSuccess(res, 'Blogs retrieved successfully', data, 200);
  } catch (error) {
    logger.error('Failed to get user blogs', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve blogs', 500);
  }
};

/**
 * Get pending blogs (admin only)
 * GET /blog/admin/pending
 */
export const getPendingBlogsHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await listPendingBlogs({ page, limit });
    const data = {
      ...result,
      blogs: (result.blogs || []).map((b) => withAbsoluteCoverUrl(b)),
    };
    return sendSuccess(res, 'Pending blogs retrieved successfully', data, 200);
  } catch (error) {
    logger.error('Failed to get pending blogs', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve pending blogs', 500);
  }
};

/**
 * Submit blog for review (author only)
 * POST /blog/:id/submit  (id can be ObjectId or slug)
 */
export const submitBlogHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);
    const blog = await submitBlog(blogId, req.user.userId);
    if (!blog) {
      return sendError(res, 'Blog not found', 404);
    }
    return sendSuccess(res, 'Blog submitted for review', { blog: withAbsoluteCoverUrl(blog) }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit blog';
    const statusCode = message.includes('Unauthorized') || message.includes('Cannot submit') ? 403 : 500;
    return sendError(res, message, statusCode);
  }
};

/**
 * Approve blog (admin only)
 * POST /blog/admin/approve/:id
 */
export const approveBlogHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    // Validate request
    const validationResult = approveBlogSchema.safeParse(req);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);

    const blog = await BlogPost.findById(blogId);
    if (!blog) {
      return sendError(res, 'Blog not found', 404);
    }

    const admin = {
      adminId: req.user.userId,
      email: req.user.email,
    };

    const approvedBlog = await approveBlog(blogId, admin);

    if (!approvedBlog) {
      return sendError(res, 'Blog not found', 404);
    }

    logger.auth('Blog approved', req.user.email, req.user.userId);

    return sendSuccess(res, 'Blog approved successfully', { blog: approvedBlog }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to approve blog';
    if (message.includes('Only pending')) return sendError(res, message, 409);
    logger.error('Failed to approve blog', error instanceof Error ? error : undefined);
    return sendError(res, message, 500);
  }
};

/**
 * Reject blog (admin only)
 * POST /blog/admin/reject/:id
 */
export const rejectBlogHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const validationResult = rejectBlogSchema.safeParse(req);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);

    const blog = await BlogPost.findById(blogId);
    if (!blog) {
      return sendError(res, 'Blog not found', 404);
    }

    const admin = {
      adminId: req.user.userId,
      email: req.user.email,
    };

    const reason = validationResult.data.body.reason;
    const rejectedBlog = await rejectBlog(blogId, admin, reason);

    if (!rejectedBlog) {
      return sendError(res, 'Blog not found', 404);
    }

    logger.auth('Blog rejected', req.user.email, req.user.userId);

    return sendSuccess(res, 'Blog rejected successfully', { blog: rejectedBlog }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reject blog';
    if (message.includes('Only pending')) return sendError(res, message, 409);
    logger.error('Failed to reject blog', error instanceof Error ? error : undefined);
    return sendError(res, message, 500);
  }
};

/**
 * Update blog (author or admin)
 * PUT /blog/:id
 */
export const updateBlogHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const validationResult = updateBlogSchema.safeParse(req);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);

    const user = await User.findById(req.user.userId).select('roles').lean();
    const isAdmin = !!(user?.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN'));

    const input = validationResult.data.body;
    // Store raw content: sanitizeHtml preserves newlines; do not collapse whitespace.
    const sanitizedInput: Partial<UpdatePostInput> = {};
    if (input.title !== undefined) sanitizedInput.title = sanitizeHtml(input.title);
    if (input.content !== undefined) sanitizedInput.content = sanitizeHtml(input.content);
    if (input.excerpt !== undefined) sanitizedInput.excerpt = input.excerpt;
    if (input.tags !== undefined) sanitizedInput.tags = input.tags;
    if (input.coverImageUrl !== undefined) sanitizedInput.coverImageUrl = input.coverImageUrl || '';
    if (input.images !== undefined) sanitizedInput.images = input.images.length <= 4 ? input.images : input.images.slice(0, 4);
    if (input.paragraphMeta !== undefined) sanitizedInput.paragraphMeta = input.paragraphMeta;
    if (input.aiFeaturesEnabled !== undefined) sanitizedInput.aiFeaturesEnabled = input.aiFeaturesEnabled;

    const blog = await updatePost(blogId, req.user.userId, sanitizedInput, isAdmin);
    if (!blog) {
      return sendError(res, 'Blog not found', 404);
    }

    logger.auth('Blog updated', req.user.email, req.user.userId, { blogId });
    return sendSuccess(res, 'Blog updated successfully', { blog: withAbsoluteCoverUrl(blog) }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update blog';
    const statusCode =
      message.includes('Unauthorized') || message.includes('Cannot edit') ? 403 : 500;
    return sendError(res, message, statusCode);
  }
};

/**
 * Delete blog (author or admin)
 * DELETE /blog/:id
 */
export const deleteBlogHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);

    const user = await User.findById(req.user.userId).select('roles').lean();
    const isAdmin = !!(user?.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN'));

    const deleted = await deletePost(blogId, req.user.userId, isAdmin);
    if (!deleted) {
      return sendError(res, 'Blog not found', 404);
    }

    logger.auth('Blog deleted', req.user.email, req.user.userId, { blogId });
    return sendSuccess(res, 'Blog deleted successfully', undefined, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete blog';
    const statusCode =
      message.includes('Unauthorized') || message.includes('Cannot delete') ? 403 : 500;
    return sendError(res, message, statusCode);
  }
};

/**
 * Toggle like on blog (authenticated users)
 * POST /blog/:id/like
 */
export const toggleLikeHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const validationResult = likeBlogSchema.safeParse(req);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);

    const result = await toggleLikeBlog(blogId, req.user.userId);

    if (!result) {
      return sendError(res, 'Blog not found', 404);
    }

    const blogObj = result.blog.toObject ? result.blog.toObject() : result.blog;
    const sanitizedBlog = sanitizePublicPost(blogObj);

    return sendSuccess(
      res,
      result.liked ? 'Blog liked' : 'Like removed',
      { blog: sanitizedBlog, liked: result.liked },
      200
    );
  } catch (error) {
    logger.error('Failed to toggle like', error instanceof Error ? error : undefined);
    const message = error instanceof Error ? error.message : 'Failed to toggle like';
    return sendError(res, message, 500);
  }
};

/**
 * Add images to blog (author or admin)
 * POST /blog/:id/images — multipart/form-data, field "images" (multiple files)
 * Returns updated image list; max count and size/MIME validated.
 */
export const uploadBlogImagesHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);

    const files = (req as Request & { files?: Express.Multer.File[] }).files;
    if (!Array.isArray(files) || files.length === 0) {
      return sendError(res, 'No images provided. Send multipart/form-data with field "images".', 400);
    }
    if (files.length > 4) {
      return sendError(res, 'At most 4 images allowed per blog.', 400);
    }

    const user = await User.findById(req.user.userId).select('roles').lean();
    const isAdmin = !!(user?.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN'));

    const result = await addBlogImages(blogId, req.user.userId, isAdmin, files);
    if (!result) {
      return sendError(res, 'Blog not found', 404);
    }
    return sendSuccess(res, 'Images uploaded successfully', result, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload images';
    const statusCode = message.includes('Unauthorized') ? 403 : message.includes('Maximum') || message.includes('At most 4') ? 400 : message.includes('Invalid') ? 400 : 500;
    return sendError(res, message, statusCode);
  }
};



