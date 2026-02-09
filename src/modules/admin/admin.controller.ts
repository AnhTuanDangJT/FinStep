import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { validateObjectId } from '../../utils/security';
import {
  listAllUsers,
  getUserDetailByPublicId,
  getPostsByAuthorPublicId,
  addAdminRole,
  removeAdminRole,
  approvePost,
  rejectPost,
  reviewPost,
  listAdminPosts,
  listMentorsForAdmin,
  setMentorVerified,
  createAuditLog,
  getAdminOverviewCounts,
  listPendingBlogsForAdmin,
  listApprovedBlogsForAdmin,
  setBlogFeatured,
  setBlogPinned,
  gradeBlog,
  listCredibilityHistory,
  getEmailByUserRef,
  adjustCredibilityByEmail,
  promoteAdminByEmail,
  getBlogByIdOrSlugForAdmin,
  listNotes,
  addNote,
  getNotesForTarget,
  getAnalytics,
  softBanUser,
  unsoftBanUser,
  setUserCredibility,
  setUserCredibilityScore,
  adjustCredibilityScoreByUserRef,
  refreshCredibilityForAuthor,
  addCredibilityForApprovedBlog,
  subtractCredibilityForRejectedBlog,
  suspendUser,
  unsuspendUser,
} from './admin.service';
import { addAdminSchema, reviewBlogSchema, removeAdminSchema, softBanSchema, credibilitySchema, addNoteSchema, adjustCredibilitySchema, adjustCredibilityByUserIdSchema, suspendUserSchema, gradeBlogSchema, adjustCredibilityByEmailSchema, promoteAdminSchema } from './admin.validator';
import { approvePostSchema, rejectPostSchema } from '../posts/post.validator';
import { getPostByIdOrSlug } from '../posts/post.service';
import { approveBlog, rejectBlog } from '../blog/blog.service';
import { User } from '../auth/auth.model';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name?: string;
  };
}

/**
 * GET /api/admin/auth/me  - Admin session check
 * Returns admin info if JWT is valid and user is admin.
 * 401 if not logged in, 403 if not admin.
 * Middleware (authenticate + requireAdmin) runs before this handler.
 */
export const adminAuthMeHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const { email } = req.user;
  const role = email === 'dganhtuan.2k5@gmail.com' ? 'SUPER_ADMIN' : 'ADMIN';
  return sendSuccess(res, 'OK', { email, role }, 200);
};

/**
 * GET /api/admin/overview (or /admin/overview)
 * Admin dashboard overview: counts only. Auth: JWT required, ADMIN or SUPER_ADMIN.
 * 401 if not authenticated, 403 if not authorized (middleware). Never 404 for auth.
 * Returns 200 with { pending, approved, users } (numbers). Safe aggregation: each count defaults to 0 on query failure.
 */
export const getAdminOverviewHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { pendingCount, approvedCount, usersCount } = await getAdminOverviewCounts();
    const payload = {
      pending: pendingCount,
      approved: approvedCount,
      users: usersCount,
    };
    return sendSuccess(res, 'OK', payload, 200);
  } catch (error) {
    logger.error('Admin overview failed', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to load admin overview', 500);
  }
};

/**
 * List all users (admin only) - returns emails only
 * GET /admin/users
 */
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await listAllUsers({ page, limit });

    // Return full profiles for admin view (name, email, linkedInUrl, role)
    return sendSuccess(res, 'Users retrieved successfully', {
      users: result.users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }, 200);
  } catch (error) {
    logger.error('Failed to get users', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve users', 500);
  }
};

/**
 * Get user detail by publicId (admin only)
 * GET /admin/users/:publicId
 */
export const getUserDetailHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { publicId } = req.params;
    if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
      return sendError(res, 'Invalid publicId', 400);
    }

    const detail = await getUserDetailByPublicId(publicId.trim());
    if (!detail) {
      return sendError(res, 'User not found', 404);
    }

    // Map to frontend-expected shape (res.data.user)
    const user = {
      name: detail.name,
      email: detail.emailMasked,
      avatarUrl: detail.avatarUrl,
      role: detail.role,
      stats: {
        blogs: {
          total: detail.blogStats.approved + detail.blogStats.rejected + detail.blogStats.pending,
          approved: detail.blogStats.approved,
          pending: detail.blogStats.pending,
          rejected: detail.blogStats.rejected,
        },
        joinedAt: detail.createdAt,
      },
    };
    return sendSuccess(res, 'User profile retrieved', { user }, 200);
  } catch (error) {
    logger.error('Failed to get user detail', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve user profile', 500);
  }
};

/**
 * Get all posts by user (admin only), with grade info.
 * GET /admin/users/:publicId/posts
 */
export const getAdminUserPostsHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { publicId } = req.params;
    if (!publicId?.trim()) return sendError(res, 'Invalid publicId', 400);
    const posts = await getPostsByAuthorPublicId(publicId.trim());
    return sendSuccess(res, 'Posts retrieved', { posts }, 200);
  } catch (error) {
    logger.error('Failed to get user posts', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve posts', 500);
  }
};

/**
 * Add admin role to user (admin only)
 * POST /admin/add-admin
 */
export const addAdmin = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    // Validate request
    const validationResult = addAdminSchema.safeParse(req);

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

    const input = validationResult.data.body;

    try {
      const result = await addAdminRole(input, { userId: req.user!.userId });
      await createAuditLog({
        actionType: 'admin_add',
        targetId: null,
        performedBy: req.user.userId,
        performedByEmail: req.user.email,
        metadata: { email: input.email },
      });
      logger.auth('Admin role added', input.email, req.user.userId);
      return sendSuccess(res, result.message, result, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add admin';
      const statusCode = message.includes('not found') ? 404 : 400;
      return sendError(res, message, statusCode);
    }
  } catch (error) {
    logger.error('Failed to add admin', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to add admin', 500);
  }
};

/**
 * Approve post (admin only)
 * POST /api/admin/posts/:id/approve
 */
export const approvePostHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    // Validate request
    const validationResult = approvePostSchema.safeParse(req);

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
    
    // Validate ID to prevent NoSQL injection
    try {
      validateObjectId(id);
    } catch (error) {
      return sendError(res, 'Invalid post ID format', 400);
    }
    
    const admin = {
      adminId: req.user.userId,
      email: req.user.email,
    };

    const post = await approvePost(id, admin);

    if (!post) {
      return sendError(res, 'Post not found', 404);
    }
    await refreshCredibilityForAuthor((post as any).author?.userId ?? '');
    await createAuditLog({
      actionType: 'post_approve',
      targetId: id,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
    });
    logger.auth('Post approved', req.user.email, req.user.userId);
    return sendSuccess(res, 'Post approved successfully', { post }, 200);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to approve post';
    if (msg.includes('Only pending')) return sendError(res, msg, 409);
    logger.error('Failed to approve post', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to approve post', 500);
  }
};

/**
 * Reject post (admin only)
 * POST /api/admin/posts/:id/reject
 */
export const rejectPostHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    // Validate request
    const validationResult = rejectPostSchema.safeParse(req);

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
    
    // Validate ID to prevent NoSQL injection
    try {
      validateObjectId(id);
    } catch (error) {
      return sendError(res, 'Invalid post ID format', 400);
    }
    
    const reason = validationResult.data.body.reason ?? '';
    if (!reason.trim()) {
      return sendError(res, 'Rejection reason is required when rejecting a blog', 400);
    }
    const admin = {
      adminId: req.user.userId,
      email: req.user.email,
    };

    const post = await rejectPost(id, admin, reason.trim());

    if (!post) {
      return sendError(res, 'Post not found', 404);
    }

    logger.auth('Post rejected', req.user.email, req.user.userId);

    return sendSuccess(res, 'Post rejected successfully', { post }, 200);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to reject post';
    if (msg.includes('Only pending')) return sendError(res, msg, 409);
    logger.error('Failed to reject post', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to reject post', 500);
  }
};

/**
 * List posts for admin (with status filter)
 * GET /api/admin/posts
 */
export const getAdminPosts = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate status if provided
    if (status && !['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return sendError(res, 'Invalid status. Must be DRAFT, PENDING, APPROVED, or REJECTED', 400);
    }

    const result = await listAdminPosts({
      status: status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | undefined,
      page,
      limit,
    });

    return sendSuccess(res, 'Posts retrieved successfully', result, 200);
  } catch (error) {
    logger.error('Failed to get admin posts', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve posts', 500);
  }
};

/**
 * List pending posts (admin only)
 * GET /api/admin/pending-posts
 */
export const getPendingPostsHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  req.query.status = 'PENDING';
  return getAdminPosts(req, res);
};

/**
 * PATCH /api/admin/blogs/:id/review
 * Admin only. Payload: { status: "APPROVED" | "REJECTED", rejectionReason?: string }.
 * REJECTED without reason → 400. Returns updated blog (id, status, rejectionReason, reviewedAt, reviewedBy).
 */
export const reviewBlogHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const validationResult = reviewBlogSchema.safeParse(req);
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
    try {
      validateObjectId(id);
    } catch {
      return sendError(res, 'Invalid blog ID format', 400);
    }

    const { status, rejectionReason } = validationResult.data.body;
    if (status === 'REJECTED' && !(rejectionReason?.trim())) {
      return sendError(res, 'Rejection reason is required when status is REJECTED', 400);
    }

    const admin = {
      adminId: req.user.userId,
      email: req.user.email,
    };

    let post;
    try {
      post = await reviewPost(id, admin, {
        status,
        rejectionReason: status === 'REJECTED' ? (rejectionReason?.trim() ?? '') : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Review failed';
      return sendError(res, message, 400);
    }

    if (!post) {
      return sendError(res, 'Blog not found', 404);
    }
    if (status === 'APPROVED') {
      await refreshCredibilityForAuthor((post as any).author?.userId ?? '');
    }
    await createAuditLog({
      actionType: 'blog_review',
      targetId: id,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { status, rejectionReason: status === 'REJECTED' ? rejectionReason : undefined },
    });
    const doc = post.toObject ? post.toObject() : post;
    const response = {
      id: doc._id?.toString?.() ?? id,
      status: doc.status,
      rejectionReason: doc.status === 'APPROVED' ? null : (doc.rejectionReason ?? null),
      reviewedAt: doc.reviewedAt ?? null,
      reviewedBy: doc.reviewedBy ?? null,
    };

    logger.auth('Blog review', req.user.email, req.user.userId, { blogId: id, status });
    return sendSuccess(res, status === 'APPROVED' ? 'Blog approved' : 'Blog rejected', response, 200);
  } catch (error) {
    logger.error('Failed to review blog', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to review blog', 500);
  }
};

/**
 * List mentors (admin only)
 * GET /api/admin/mentors
 */
export const getMentorsHandler = async (_req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const profiles = await listMentorsForAdmin();
    return sendSuccess(res, 'Mentors retrieved', { mentors: profiles }, 200);
  } catch (e) {
    logger.error('Failed to get mentors', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve mentors', 500);
  }
};

/**
 * Set mentor verified (admin only)
 * POST /api/admin/mentors/:userId/verify
 * Body: { verified: boolean }
 */
export const verifyMentorHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const verified = req.body?.verified === true;
    const profile = await setMentorVerified(userId, verified);
    if (!profile) return sendError(res, 'Mentor profile not found', 404);
    return sendSuccess(res, verified ? 'Mentor verified' : 'Mentor unverified', {
      mentor: {
        userId: profile.userId,
        pathTitle: profile.pathTitle,
        verified: profile.verified,
      },
    }, 200);
  } catch (e) {
    logger.error('Failed to verify mentor', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to update mentor verification', 500);
  }
};

/**
 * Remove admin (super admin only)
 * POST /api/admin/admins/remove  Body: { email: string }
 */
export const removeAdmin = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = removeAdminSchema.safeParse(req);
    if (!v.success) {
      return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    }
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const result = await removeAdminRole(v.data.body.email);
    await createAuditLog({
      actionType: 'admin_remove',
      targetId: null,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { email: v.data.body.email },
    });
    return sendSuccess(res, result.message, result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to remove admin';
    const status = msg.includes('not found') ? 404 : msg.includes('not an admin') ? 400 : 500;
    return sendError(res, msg, status);
  }
};

/**
 * GET /admin/blogs/pending
 */
export const getPendingBlogsHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await listPendingBlogsForAdmin({ page, limit });
    return sendSuccess(res, 'Pending blogs retrieved', result, 200);
  } catch (e) {
    logger.error('Failed to get pending blogs', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve pending blogs', 500);
  }
};

/**
 * GET /admin/blogs/approved – approved blogs with grade/gradedAt for admin grading tab
 */
export const getApprovedBlogsForAdminHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await listApprovedBlogsForAdmin({ page, limit });
    return sendSuccess(res, 'Approved blogs retrieved', result, 200);
  } catch (e) {
    logger.error('Failed to get approved blogs for admin', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve approved blogs', 500);
  }
};

/**
 * POST /admin/blogs/:id/approve  Body: { optionalNote? }
 */
export const approveBlogHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { id } = req.params;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);
    const admin = { adminId: req.user.userId, email: req.user.email };
    const blog = await approveBlog(blogId, admin);
    if (!blog) return sendError(res, 'Blog not found', 404);
    const authorEmail = (blog as any).author?.email;
    if (authorEmail) {
      await addCredibilityForApprovedBlog(authorEmail, req.user.email, blogId);
    }
    await refreshCredibilityForAuthor((blog as any).author?.userId ?? '');
    await createAuditLog({
      actionType: 'blog_approve',
      targetId: blogId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { optionalNote: req.body?.optionalNote, targetEmail: authorEmail },
    });
    return sendSuccess(res, 'Blog approved', { blog }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to approve blog';
    if (msg.includes('Only pending')) return sendError(res, msg, 409);
    logger.error('Failed to approve blog', e instanceof Error ? e : undefined);
    return sendError(res, msg, 500);
  }
};

/**
 * POST /admin/blogs/:id/reject  Body: { rejectionReason: string }
 */
export const rejectBlogHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { id } = req.params;
    const rejectionReason = typeof req.body?.rejectionReason === 'string' ? req.body.rejectionReason.trim() : (typeof req.body?.reason === 'string' ? req.body.reason.trim() : '');
    if (!rejectionReason) return sendError(res, 'Rejection reason is required', 400);
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);
    const admin = { adminId: req.user.userId, email: req.user.email };
    const blog = await rejectBlog(blogId, admin, rejectionReason);
    if (!blog) return sendError(res, 'Blog not found', 404);
    const authorEmail = (blog as any).author?.email;
    if (authorEmail) {
      await subtractCredibilityForRejectedBlog(authorEmail, req.user.email, blogId);
    }
    await createAuditLog({
      actionType: 'blog_reject',
      targetId: blogId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { rejectionReason, targetEmail: authorEmail },
    });
    return sendSuccess(res, 'Blog rejected', { blog }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to reject blog';
    if (msg.includes('Only pending')) return sendError(res, msg, 409);
    logger.error('Failed to reject blog', e instanceof Error ? e : undefined);
    return sendError(res, msg, 500);
  }
};

/**
 * PATCH /admin/blogs/:id/feature  Body: { featured: boolean }
 */
export const featureBlogHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { id } = req.params;
    const featured = req.body?.featured === true;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);
    const blog = await setBlogFeatured(blogId, featured);
    if (!blog) return sendError(res, 'Blog not found', 404);
    await createAuditLog({
      actionType: 'blog_feature',
      targetId: blogId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { featured },
    });
    return sendSuccess(res, featured ? 'Blog featured' : 'Blog unfeatured', { blog }, 200);
  } catch (e) {
    logger.error('Failed to feature blog', e instanceof Error ? e : undefined);
    return sendError(res, e instanceof Error ? e.message : 'Failed to update feature', 500);
  }
};

/**
 * PATCH /admin/blogs/:id/pin  Body: { pinned: boolean }
 */
export const pinBlogHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { id } = req.params;
    const pinned = req.body?.pinned === true;
    const post = await getPostByIdOrSlug(id);
    if (!post) return sendError(res, 'Blog not found', 404);
    const blogId = (post as any)._id?.toString?.();
    if (!blogId) return sendError(res, 'Blog not found', 404);
    const blog = await setBlogPinned(blogId, pinned);
    if (!blog) return sendError(res, 'Blog not found', 404);
    await createAuditLog({
      actionType: 'blog_pin',
      targetId: blogId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { pinned },
    });
    return sendSuccess(res, pinned ? 'Blog pinned' : 'Blog unpinned', { blog }, 200);
  } catch (e) {
    logger.error('Failed to pin blog', e instanceof Error ? e : undefined);
    return sendError(res, e instanceof Error ? e.message : 'Failed to update pin', 500);
  }
};

/**
 * GET /admin/notes?targetType=user|blog&targetId=...
 */
export const getNotesHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const targetType = req.query.targetType as string | undefined;
    const targetId = req.query.targetId as string | undefined;
    if (targetType && targetId) {
      const result = await getNotesForTarget(targetType as 'user' | 'blog', targetId);
      return sendSuccess(res, 'Notes retrieved', result, 200);
    }
    const result = await listNotes({ targetType: targetType as 'user' | 'blog' | undefined, targetId });
    return sendSuccess(res, 'Notes retrieved', result, 200);
  } catch (e) {
    logger.error('Failed to get notes', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve notes', 500);
  }
};

/**
 * POST /admin/notes  Body: { targetType, targetId, note }
 */
export const addNoteHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = addNoteSchema.safeParse(req);
    if (!v.success) {
      return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    }
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const created = await addNote({
      targetType: v.data.body.targetType,
      targetId: v.data.body.targetId,
      note: v.data.body.note,
      createdBy: req.user.userId,
    });
    await createAuditLog({
      actionType: 'note_add',
      targetId: v.data.body.targetId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { targetType: v.data.body.targetType },
    });
    return sendSuccess(res, 'Note added', created, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to add note';
    if (msg.includes('Invalid targetId')) return sendError(res, msg, 400);
    logger.error('Failed to add note', e instanceof Error ? e : undefined);
    return sendError(res, msg, 500);
  }
};

/**
 * GET /admin/analytics
 */
export const getAnalyticsHandler = async (_req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const data = await getAnalytics();
    return sendSuccess(res, 'Analytics retrieved', data, 200);
  } catch (e) {
    logger.error('Failed to get analytics', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve analytics', 500);
  }
};

/**
 * PATCH /admin/users/:userId/soft-ban  Body: { banned: boolean }
 */
export const softBanUserHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = softBanSchema.safeParse(req);
    if (!v.success) {
      return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    }
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { userId } = v.data.params;
    const banned = v.data.body.banned === true;
    const fn = banned ? softBanUser : unsoftBanUser;
    const result = await fn(userId);
    await createAuditLog({
      actionType: banned ? 'user_soft_ban' : 'user_soft_unban',
      targetId: userId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
    });
    return sendSuccess(res, result.message, result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update soft-ban';
    return sendError(res, msg, msg.includes('not found') ? 404 : 500);
  }
};

/**
 * POST /admin/users/:userId/credibility  Body: { score: number (0-100), reason: string }
 * Manual admin adjustment with score and reason. Supports userId as publicId or ObjectId.
 */
export const adjustCredibilityByUserIdHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = adjustCredibilityByUserIdSchema.safeParse(req);
    if (!v.success) return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { userId } = v.data.params;
    const { score, reason } = v.data.body;
    const result = await adjustCredibilityScoreByUserRef(userId, score, reason, req.user.userId, req.user.email);
    await createAuditLog({
      actionType: 'credibility_adjust',
      targetId: userId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { score, reason },
    });
    return sendSuccess(res, result.message, result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to adjust credibility';
    return sendError(res, msg, msg.includes('not found') ? 404 : 500);
  }
};

/**
 * PATCH /admin/users/:userId/credibility  Body: { level: 'beginner'|'contributor'|'trusted_writer'|'mentor' }
 */
export const setCredibilityHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = credibilitySchema.safeParse(req);
    if (!v.success) {
      return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    }
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { userId } = v.data.params;
    const level = v.data.body.level;
    const result = await setUserCredibility(userId, level, req.user.userId);
    await createAuditLog({
      actionType: 'credibility_set',
      targetId: userId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { level },
    });
    return sendSuccess(res, result.message, result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to set credibility';
    return sendError(res, msg, msg.includes('not found') ? 404 : 500);
  }
};

/**
 * POST /admin/adjust-credibility  Body: { userId, score (0-100) } — spec: manual admin adjustment
 */
export const adjustCredibilityHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = adjustCredibilitySchema.safeParse(req);
    if (!v.success) return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { userId, score } = v.data.body;
    const result = await setUserCredibilityScore(userId, score, req.user.userId);
    await createAuditLog({
      actionType: 'credibility_adjust',
      targetId: userId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { score },
    });
    return sendSuccess(res, result.message, result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to adjust credibility';
    return sendError(res, msg, msg.includes('not found') ? 404 : 500);
  }
};

/**
 * POST /admin/suspend-user  Body: { userId, setCredibilityToZero?: boolean } — spec: violations → 0 + suspend
 */
export const suspendUserHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = suspendUserSchema.safeParse(req);
    if (!v.success) return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { userId, setCredibilityToZero } = v.data.body;
    const result = await suspendUser(userId, { setCredibilityToZero, adminEmail: req.user!.email });
    await createAuditLog({
      actionType: 'user_suspend',
      targetId: userId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { setCredibilityToZero: !!setCredibilityToZero },
    });
    return sendSuccess(res, result.message, result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to suspend user';
    return sendError(res, msg, msg.includes('not found') ? 404 : msg.includes('super admin') ? 403 : 500);
  }
};

/**
 * POST /admin/unsuspend-user  Body: { userId }
 */
export const unsuspendUserHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.body?.userId;
    if (!userId || typeof userId !== 'string') return sendError(res, 'userId is required', 400);
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const result = await unsuspendUser(userId);
    await createAuditLog({
      actionType: 'user_unsuspend',
      targetId: userId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
    });
    return sendSuccess(res, result.message, result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to unsuspend user';
    return sendError(res, msg, msg.includes('not found') ? 404 : 500);
  }
};

/**
 * POST /admin/blogs/:id/grade  Body: { grade: number(0..100), reason?: string }
 * Defensive validation order: blogId → status APPROVED → authorEmail → author user exists → not already graded.
 * Transactional write; returns 4xx for validation, 500 only on rollback.
 */
export const gradeBlogHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const adminEmail = req.user?.email ?? '';
  let blogId: string | null = null;
  let authorEmail: string | null = null;
  let grade: number = 0;
  let delta: number = 0;

  try {
    const v = gradeBlogSchema.safeParse(req);
    if (!v.success) return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    if (!req.user) return sendError(res, 'Unauthorized', 401);

    const { id } = req.params;
    if (!id?.trim()) return sendError(res, 'Blog id is required', 400);

    // 1) blogId exists and is valid → 404 if not found
    const blog = await getBlogByIdOrSlugForAdmin(id);
    if (!blog) return sendError(res, 'Blog not found', 404);
    blogId = (blog as any)._id?.toString?.() ?? null;
    if (!blogId) return sendError(res, 'Blog not found', 404);

    // 2) blog.status === "APPROVED" → 400 if not
    if (blog.status !== 'APPROVED') {
      return sendError(res, 'Post must be approved before grading', 400);
    }

    // 3) blog.authorEmail (author.email) exists → 400 if missing
    authorEmail = (blog as any).author?.email ?? null;
    if (!authorEmail?.trim()) {
      return sendError(res, 'Post author missing', 400);
    }

    // 4) User with authorEmail exists → 404 if not
    const authorUser = await User.findOne({ email: authorEmail.toLowerCase().trim() }).select('_id').lean();
    if (!authorUser) {
      return sendError(res, 'Author not found', 404);
    }

    grade = v.data.body.grade;
    const alreadyGraded = (blog as any).grade != null || (blog as any).gradedAt != null;
    const regradeRequested = v.data.body.regrade === true;
    if (alreadyGraded && !regradeRequested) {
      return sendError(res, 'Post has already been graded. Send regrade: true to update.', 409);
    }
    const result = await gradeBlog(
      blogId,
      { adminId: req.user.userId, email: req.user.email },
      grade,
      { reason: v.data.body.reason ?? undefined, regrade: alreadyGraded }
    );
    delta = result.delta;

    logger.info('admin grade success', {
      blogId,
      authorEmail: authorEmail.toLowerCase(),
      grade,
      delta,
      adminEmail: adminEmail.toLowerCase(),
      regraded: result.regraded,
    });

    await createAuditLog({
      actionType: result.regraded ? 'blog_regrade' : 'blog_grade',
      targetId: blogId,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { grade, gradeLabel: result.blog.gradeLabel, delta, newCredibility: result.newCredibility, regraded: result.regraded },
    });

    const message = result.regraded ? 'Post grade updated' : 'Post graded successfully';
    return sendSuccess(res, message, {
      blog: result.blog,
      grade: result.blog.grade,
      delta: result.delta,
      newCredibility: result.newCredibility,
      regraded: result.regraded,
    }, 200);
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Unknown error');
    logger.error(
      `admin grade failed: blogId=${blogId ?? 'unknown'} authorEmail=${authorEmail ?? 'unknown'} grade=${grade} delta=${delta} adminEmail=${adminEmail || 'unknown'} error=${err.message}`,
      err
    );

    const msg = err.message;
    let status = 500;
    let safeMessage = 'Grading failed';
    if (msg.includes('already graded') || msg.includes('already been graded')) {
      status = 409;
      safeMessage = 'Post has already been graded';
    } else if (msg.includes('approved') || msg.includes('author') || msg.includes('Post author')) {
      status = 400;
      safeMessage = msg;
    } else if (msg.includes('not found') || msg.includes('Author not found')) {
      status = 404;
      safeMessage = msg;
    }

    return sendError(res, safeMessage, status);
  }
};

/**
 * POST /admin/users/adjust-credibility  Body: { targetEmail, delta, reason }
 */
export const adjustCredibilityByEmailHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = adjustCredibilityByEmailSchema.safeParse(req);
    if (!v.success) return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const { targetEmail, delta, reason } = v.data.body;
    const isSuperAdmin = req.user.email === 'dganhtuan.2k5@gmail.com';
    const result = await adjustCredibilityByEmail(targetEmail, delta, reason, req.user.email, isSuperAdmin);
    await createAuditLog({
      actionType: 'credibility_adjust',
      targetId: null,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { targetEmail, delta, reason },
    });
    return sendSuccess(res, 'Credibility adjusted', result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to adjust credibility';
    return sendError(res, msg, msg.includes('not found') ? 404 : 500);
  }
};

/**
 * POST /admin/users/promote-admin  Body: { targetEmail }  — SUPER_ADMIN only
 */
export const promoteAdminHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const v = promoteAdminSchema.safeParse(req);
    if (!v.success) return sendError(res, 'Validation failed', 400, JSON.stringify(v.error.errors));
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const result = await promoteAdminByEmail(v.data.body.targetEmail);
    await createAuditLog({
      actionType: 'admin_promote',
      targetId: null,
      performedBy: req.user.userId,
      performedByEmail: req.user.email,
      metadata: { targetEmail: v.data.body.targetEmail },
    });
    return sendSuccess(res, result.message, result, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to promote admin';
    return sendError(res, msg, msg.includes('not found') ? 404 : msg.includes('already an admin') ? 400 : 500);
  }
};

/**
 * GET /admin/users/:email/credibility-history  (paged)
 * Param can be email or userId/publicId (frontend may pass user id).
 */
export const getCredibilityHistoryHandler = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const param = (req.params.email || '').trim();
    if (!param) return sendError(res, 'User identifier or email is required', 400);
    let email: string;
    if (param.includes('@')) {
      email = param;
    } else {
      const resolved = await getEmailByUserRef(param);
      if (!resolved) return sendError(res, 'User not found', 404);
      email = resolved;
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await listCredibilityHistory(email, { page, limit });
    return sendSuccess(res, 'Credibility history retrieved', result, 200);
  } catch (e) {
    logger.error('Failed to get credibility history', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve credibility history', 500);
  }
};
