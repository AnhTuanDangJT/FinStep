import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { sanitizeHtml, sanitizePublicPost, sanitizeQueryParam } from '../../utils/security';
import {
  createPost,
  getPostBySlug,
  getPostByIdOrSlug,
  listPublicPosts,
  listUserPosts,
  updatePost,
  deletePost,
  submitPost,
  toggleLikePost,
  addComment,
  listCommentsByPostId,
  getCommentCountByPostId,
  addPostUpdate,
  listPostUpdates,
  listRecommendedPosts,
} from './post.service';
import {
  createPostSchema,
  updatePostSchema,
  commentPostSchema,
  postUpdateNoteSchema,
} from './post.validator';
import { User } from '../auth/auth.model';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name?: string;
  };
}

/**
 * Get public posts (APPROVED only)
 * GET /api/posts
 */
export const getPublicPosts = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Sanitize query params to prevent NoSQL injection (reject objects)
    const status = sanitizeQueryParam(req.query.status);
    const tag = sanitizeQueryParam(req.query.tag);
    const tagsRaw = sanitizeQueryParam(req.query.tags, 500);
    const category = sanitizeQueryParam(req.query.category);
    const search = sanitizeQueryParam(req.query.search, 200);
    const sort = sanitizeQueryParam(req.query.sort, 20);
    const page = Math.min(Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1), 100);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '10'), 10) || 10, 1), 50);

    if (status && status !== 'APPROVED') {
      return sendError(res, 'Invalid status filter for public endpoint', 400);
    }

    const tags = tagsRaw ? tagsRaw.split(',').map((t) => sanitizeQueryParam(t, 50)).filter(Boolean) as string[] : undefined;
    const result = await listPublicPosts({ tag, tags, category, search, sort, page, limit });

    // Sanitize posts to remove internal fields
    const sanitizedResult = {
      ...result,
      posts: result.posts.map(sanitizePublicPost),
    };

    return sendSuccess(res, 'Posts retrieved successfully', sanitizedResult, 200);
  } catch (error) {
    logger.error('Failed to get public posts', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve posts', 500);
  }
};

/**
 * Get post by slug (public - APPROVED only)
 * GET /api/posts/slug/:slug
 */
export const getPostBySlugHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { slug } = req.params;

    const post = await getPostBySlug(slug);

    if (!post) {
      return sendError(res, 'Post not found', 404);
    }

    const sanitizedPost = sanitizePublicPost(post);

    return sendSuccess(res, 'Post retrieved successfully', { post: sanitizedPost }, 200);
  } catch (error) {
    logger.error('Failed to get post by slug', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve post', 500);
  }
};

/**
 * Get post by ID or slug (public if APPROVED; else only author/admin can view)
 * GET /api/posts/:id  (id can be ObjectId or slug)
 */
export const getPostByIdHandler = async (
  req: Request & { user?: { userId: string; email: string } },
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);

    if (!post) {
      logger.info('Post getByIdOrSlug: post not found', { id, hasUser: !!req.user?.userId });
      return sendError(res, 'Post not found', 404);
    }

    // Public: only APPROVED posts
    if (post.status === 'APPROVED') {
      const commentCount = await getCommentCountByPostId(post._id.toString());
      const postWithCount = { ...(post as object), commentCount };
      const sanitizedPost = sanitizePublicPost(postWithCount);
      logger.info('Post getByIdOrSlug: returned public APPROVED post', { id, postId: post._id?.toString() });
      return sendSuccess(res, 'Post retrieved successfully', { post: sanitizedPost }, 200);
    }

    // Non-APPROVED: only author or admin can view
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }
    const isAuthor = post.author?.userId === userId;
    const user = await User.findById(userId).select('roles').lean();
    const isAdmin = !!(user?.roles && user.roles.includes('ADMIN'));
    if (!isAuthor && !isAdmin) {
      return sendError(res, 'Forbidden', 403);
    }

    const commentCount = await getCommentCountByPostId(post._id.toString());
    const postWithCount = { ...(post as object), commentCount };
    const sanitizedPost = sanitizePublicPost(postWithCount);
    logger.info('Post getByIdOrSlug: returned post', { id, postId: post._id?.toString(), status: post.status, isAuthorOrAdmin: true });
    return sendSuccess(res, 'Post retrieved successfully', { post: sanitizedPost }, 200);
  } catch (error) {
    logger.error('Failed to get post by id', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve post', 500);
  }
};

/**
 * Get shareable URL for post
 * POST /api/posts/:id/share  (id can be ObjectId or slug)
 * Public for APPROVED; author/admin only for non-APPROVED
 */
export const getShareUrlHandler = async (
  req: Request & { user?: { userId: string } },
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) {
      return sendError(res, 'Post not found', 404);
    }

    // Non-APPROVED: only author or admin can get share URL
    if (post.status !== 'APPROVED') {
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }
      const user = await User.findById(userId).select('roles').lean();
      const isAdmin = !!(user?.roles && user.roles.includes('ADMIN'));
      const isAuthor = post.author?.userId === userId;
      if (!isAuthor && !isAdmin) {
        return sendError(res, 'Forbidden', 403);
      }
    }

    const frontendUrl = (env.PUBLIC_APP_URL || env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    // Primary shareable link by slug so /blogs/[slug] works for guests
    const shareUrl = post.slug
      ? `${frontendUrl}/blogs/${post.slug}`
      : `${frontendUrl}/blogs/${post._id}`;
    const shareUrlById = `${frontendUrl}/blogs/${post._id}`;

    return sendSuccess(res, 'Share URL generated', {
      shareUrl,
      ...(post.slug && { shareUrlBySlug: shareUrl }),
      shareUrlById,
    }, 200);
  } catch (error) {
    logger.error('Failed to get share URL', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to get share URL', 500);
  }
};

/**
 * Submit post for review (author only)
 * POST /api/posts/:id/submit
 */
export const submitPostHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }
    const { id } = req.params;
    const post = await submitPost(id, req.user.userId);
    if (!post) {
      return sendError(res, 'Post not found', 404);
    }
    const sanitizedPost = sanitizePublicPost(post);
    return sendSuccess(res, 'Post submitted for review', { post: sanitizedPost }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit post';
    const statusCode = message.includes('Unauthorized') || message.includes('Cannot submit') ? 403 : 500;
    return sendError(res, message, statusCode);
  }
};

/**
 * Toggle like on post (authenticated)
 * POST /api/posts/:id/like - like or unlike (toggle)
 * DELETE /api/posts/:id/like - unlike only
 */
export const toggleLikeHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { id } = req.params;
    const unlikeOnly = req.method === 'DELETE';
    const result = await toggleLikePost(id, req.user.userId, unlikeOnly);

    if (!result) {
      return sendError(res, 'Post not found', 404);
    }

    const sanitizedPost = sanitizePublicPost(result.post);

    return sendSuccess(
      res,
      result.liked ? 'Post liked' : 'Like removed',
      { post: sanitizedPost, liked: result.liked },
      200
    );
  } catch (error) {
    logger.error('Failed to toggle like', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to toggle like', 500);
  }
};

/**
 * Add comment on post (authenticated or guest)
 * POST /api/posts/:id/comment  (id can be ObjectId or slug)
 * Extracts user from session/JWT; if user exists → use user.id, if guest → authorName = "Guest"
 * Returns { comment, totalCount } with totalCount from DB
 */
export const addCommentHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const validationResult = commentPostSchema.safeParse(req);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    const { id } = req.params;
    const { content } = validationResult.data.body;

    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Post not found', 404);
    const postIdStr = (post as any)._id?.toString?.();
    if (!postIdStr) return sendError(res, 'Post not found', 404);

    let authorId: mongoose.Types.ObjectId | undefined;
    let authorName: string;

    let authorAvatar: string | null = null;
    if (req.user) {
      const user = await User.findById(req.user.userId).select('name avatarUrl').lean();
      if (user) {
        authorId = user._id as mongoose.Types.ObjectId;
        authorName = (user.name && user.name.trim()) || req.user.email?.split('@')[0] || 'User';
        if (user.avatarUrl) {
          const { getAbsoluteUploadUrl } = await import('../../config/env');
          authorAvatar = getAbsoluteUploadUrl(user.avatarUrl) ?? user.avatarUrl;
        }
      } else {
        authorName = 'Guest';
      }
    } else {
      authorName = 'Guest';
    }

    const comment = await addComment(postIdStr, content, authorId, authorName);

    if (!comment) {
      return sendError(res, 'Post not found', 404);
    }

    const commentResponse = {
      id: comment._id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        name: authorName,
        avatar: authorAvatar,
        // Never expose author internal id (userId) in public responses
      },
    };

    const totalCount = await getCommentCountByPostId(postIdStr);

    return sendSuccess(
      res,
      'Comment added',
      {
        comment: commentResponse,
        totalCount,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add comment';
    const statusCode = message.includes('Only approved') ? 403 : 500;
    logger.error('Failed to add comment', error instanceof Error ? error : undefined);
    return sendError(res, message, statusCode);
  }
};

/**
 * Add update to post (living post) – author only, post must be APPROVED
 * POST /api/posts/:id/updates
 */
export const addPostUpdateHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const validationResult = postUpdateNoteSchema.safeParse(req);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { id } = req.params;
    const { updateNote } = validationResult.data.body;
    const update = await addPostUpdate(id, req.user.userId, updateNote);
    if (!update) return sendError(res, 'Post not found or not approved', 404);
    return sendSuccess(res, 'Update added', {
      update: {
        id: update._id.toString(),
        postId: update.postId.toString(),
        updateNote: update.updateNote,
        createdAt: update.createdAt,
      },
    }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to add update';
    const code = msg.includes('Unauthorized') ? 403 : 500;
    return sendError(res, msg, code);
  }
};

/**
 * Get updates for a post (public for APPROVED posts)
 * GET /api/posts/:id/updates  (id can be ObjectId or slug)
 */
export const getPostUpdatesHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Post not found', 404);
    const postIdStr = (post as any)._id?.toString?.() ?? (post as any).id;
    if (!postIdStr) return sendError(res, 'Post not found', 404);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await listPostUpdates(postIdStr, { page, limit });
    return sendSuccess(res, 'Updates retrieved', result, 200);
  } catch (e) {
    logger.error('Get post updates failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to get updates', 500);
  }
};

/**
 * Get recommended posts (rule-based: journeyGoal, careerStage, experienceLevel)
 * GET /api/posts/recommended?journeyGoal=&careerStage=&experienceLevel=&limit=
 * Optional auth: if user is logged in, can use their careerStage from profile when not in query.
 */
export const getRecommendedPostsHandler = async (
  req: Request & { user?: { userId: string } },
  res: Response
): Promise<Response> => {
  try {
    let journeyGoal = (req.query.journeyGoal as string) || undefined;
    let careerStage = (req.query.careerStage as string) || undefined;
    const experienceLevel = (req.query.experienceLevel as string) || undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    if (req.user && !careerStage) {
      const user = await User.findById(req.user.userId).select('careerStage').lean();
      if (user?.careerStage) careerStage = user.careerStage;
    }
    const posts = await listRecommendedPosts({ journeyGoal, careerStage, experienceLevel, limit });
    const sanitized = posts.map((p) => sanitizePublicPost(p));
    return sendSuccess(res, 'Recommended posts', { posts: sanitized }, 200);
  } catch (e) {
    logger.error('Get recommended failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to get recommended posts', 500);
  }
};

/**
 * Get comments for a post. Guests may only read comments for APPROVED posts (404 otherwise).
 * GET /api/posts/:id/comments  (id can be ObjectId or slug)
 * Returns { comments: [...], totalCount: <COUNT in DB> }
 */
export const getCommentsHandler = async (
  req: Request & { user?: { userId: string } },
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Post not found', 404);
    if (post.status !== 'APPROVED' && !req.user) {
      return sendError(res, 'Post not found', 404);
    }
    const postIdStr = (post as any)._id?.toString?.() ?? (post as any).id;
    if (!postIdStr) return sendError(res, 'Post not found', 404);

    const result = await listCommentsByPostId(postIdStr, { page, limit });
    return sendSuccess(res, 'Comments retrieved successfully', {
      comments: result.comments,
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }, 200);
  } catch (error) {
    logger.error('Failed to get comments', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve comments', 500);
  }
};

/**
 * Create new post (authenticated users)
 * POST /api/posts
 */
export const createPostHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    // Validate request
    const validationResult = createPostSchema.safeParse(req);

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

    // Get user details for author snapshot
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const input = validationResult.data.body;
    
    // Sanitize content to prevent XSS
    const sanitizedInput = {
      ...input,
      content: sanitizeHtml(input.content),
      excerpt: sanitizeHtml(input.excerpt),
      title: sanitizeHtml(input.title),
    };
    
    // Author snapshot: ensure name/email never empty (required by post model)
    const author = {
      userId: req.user.userId,
      name: (user.name && user.name.trim()) || user.email?.split('@')[0] || 'User',
      email: req.user.email,
    };

    const post = await createPost(sanitizedInput, author);

    logger.auth('Post created', req.user.email, req.user.userId);

    return sendSuccess(res, 'Post created successfully', { post }, 201);
  } catch (error) {
    logger.error('Failed to create post', error instanceof Error ? error : undefined);
    const message = error instanceof Error ? error.message : 'Failed to create post';
    return sendError(res, message, 500);
  }
};

/**
 * Get user's own posts (any status)
 * GET /api/posts/mine
 */
export const getMyPosts = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = { page, limit };

    const result = await listUserPosts(req.user.userId, { page, limit });
    const sanitizedPosts = result.posts.map(sanitizePublicPost);

    logger.info('Posts getMyPosts: request identity and result', {
      userId: req.user.userId,
      email: req.user.email,
      queryFilters: filters,
      postsReturned: result.posts.length,
      total: result.total,
    });

    // Return data as array so frontend getMyPosts() → res.data is Post[]
    return sendSuccess(res, 'Posts retrieved successfully', sanitizedPosts, 200);
  } catch (error) {
    logger.error('Failed to get user posts', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve posts', 500);
  }
};

/**
 * Update post (author only, only if PENDING or REJECTED)
 * PUT /api/posts/:id
 */
export const updatePostHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    // Validate request
    const validationResult = updatePostSchema.safeParse(req);

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

    // Fetch user from DB to check admin role (JWT does not include role)
    const user = await User.findById(req.user!.userId).select('roles').lean();
    const isAdmin = !!(user?.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN'));

    logger.auth('Update post attempt', req.user!.email, req.user!.userId, { postId: id, isAdmin });

    const input = validationResult.data.body;
    
    // Sanitize content to prevent XSS
    const sanitizedInput: any = {};
    if (input.title !== undefined) {
      sanitizedInput.title = sanitizeHtml(input.title);
    }
    if (input.content !== undefined) {
      sanitizedInput.content = sanitizeHtml(input.content);
    }
    if (input.excerpt !== undefined) {
      sanitizedInput.excerpt = sanitizeHtml(input.excerpt);
    }
    if (input.tags !== undefined) {
      sanitizedInput.tags = input.tags;
    }
    if (input.coverImageUrl !== undefined) {
      sanitizedInput.coverImageUrl = input.coverImageUrl;
    }
    if (input.summary !== undefined) {
      sanitizedInput.summary = input.summary;
    }

    const post = await updatePost(id, req.user!.userId, sanitizedInput, isAdmin);

    if (!post) {
      logger.auth('Update post: not found', req.user!.email, undefined, { postId: id });
      return sendError(res, 'Post not found', 404);
    }
    logger.auth('Post updated', req.user!.email, req.user!.userId, { postId: id });
    return sendSuccess(res, 'Post updated successfully', { post: sanitizePublicPost(post) }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update post';
    const statusCode = message.includes('Unauthorized') || message.includes('Cannot edit') ? 403 : 500;
    logger.auth('Update post: authorization failed', req.user!.email, req.user!.userId, {
      postId: req.params?.id,
      reason: message,
    });
    return sendError(res, message, statusCode);
  }
};

/**
 * Delete post (author only, only if not APPROVED)
 * DELETE /api/posts/:id
 */
export const deletePostHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { id } = req.params;

    // Fetch user from DB to check admin role (JWT does not include role)
    const user = await User.findById(req.user!.userId).select('roles').lean();
    const isAdmin = !!(user?.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN'));

    logger.auth('Delete post attempt', req.user!.email, req.user!.userId, { postId: id, isAdmin });

    const deleted = await deletePost(id, req.user!.userId, isAdmin);

    if (!deleted) {
      logger.auth('Delete post: not found', req.user!.email, undefined, { postId: id });
      return sendError(res, 'Post not found', 404);
    }

    logger.auth('Post deleted', req.user!.email, req.user!.userId, { postId: id });
    return sendSuccess(res, 'Post deleted successfully', undefined, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete post';
    const statusCode = message.includes('Unauthorized') || message.includes('Cannot delete') ? 403 : 500;
    logger.auth('Delete post: authorization failed', req.user!.email, req.user!.userId, {
      postId: req.params?.id,
      reason: message,
    });
    return sendError(res, message, statusCode);
  }
};

