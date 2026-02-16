import { Request, Response, NextFunction } from 'express';
import { getAbsoluteUploadUrl } from '../config/env';

/**
 * Security utility functions
 */

/**
 * Strip forbidden fields from request body to prevent privilege escalation
 * Fields that should NEVER be set by users:
 * - role, roles: Only admins can modify via admin endpoints
 * - author, authorId: Author is set from authenticated user
 * - status: Post status can only be changed by admins
 * - passwordHash, password: Password changes should use dedicated endpoint
 * - googleId: OAuth ID should not be modifiable
 */
export const stripForbiddenFields = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    // Remove forbidden fields that could be used for privilege escalation
    delete req.body.role;
    delete req.body.roles;
    delete req.body.author;
    delete req.body.authorId;
    delete req.body.status;
    delete req.body.passwordHash;
    delete req.body.password;
    delete req.body.googleId;
    delete req.body._id;
    delete req.body.__v;
    delete req.body.publicId; // Client must never set publicId
    delete req.body.createdAt;
    delete req.body.updatedAt;
    delete req.body.reviewedBy;
    delete req.body.reviewedAt;
    delete req.body.isFeatured;
    delete req.body.isPinned;
    delete req.body.editorPick;
    delete req.body.clarityScore;
    delete req.body.originalityScore;
    delete req.body.financeRelevanceScore;
    delete req.body.riskFlag;
  }
  next();
};

/**
 * Sanitize query param to prevent NoSQL injection - ensure string, not object
 * Blocks { $gt: '' } or other operator objects in place of strings
 */
export const sanitizeQueryParam = (value: unknown, maxLength = 200): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return undefined; // Reject objects, arrays
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || undefined;
};

/**
 * Validate and cast MongoDB ObjectId to prevent NoSQL injection
 * @throws Error if ID is invalid
 */
export const validateObjectId = (id: string): string => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid ID format');
  }
  
  // Basic ObjectId format validation (24 hex characters)
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (!objectIdPattern.test(id.trim())) {
    throw new Error('Invalid ID format');
  }
  
  return id.trim();
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * - Removes script tags, iframes, and dangerous attributes
 * - Strips event handlers and javascript: protocol
 *
 * CRITICAL: DO NOT replace newlines (\n or \n\n) or collapse whitespace.
 * Blog content must preserve paragraph structure exactly as submitted.
 */
export const sanitizeHtml = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*\/?>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and data: URLs in href/src
  sanitized = sanitized.replace(/\s*(href|src)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '');
  sanitized = sanitized.replace(/\s*(href|src)\s*=\s*["']?\s*data:\s*text\/html[^"'\s>]*/gi, '');

  return sanitized;
};

/**
 * Mask email for public display: "j***@example.com"
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '***@***';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const masked = local.length <= 2 ? '**' : local[0] + '***' + local[local.length - 1];
  return `${masked}@${domain}`;
}

/**
 * Sanitize post data for public endpoints
 * NEVER expose: authorId, author.userId, author.email (raw)
 * _id and likedBy are included so the client can call like/comment APIs and show "liked" state.
 */
export const sanitizePublicPost = (post: any): any => {
  if (!post || typeof post !== 'object') {
    return post;
  }

  const authorDisplay = (post.author?.displayName || post.author?.name || maskEmail(post.author?.email || '')).trim() || 'Author';
  const coverUrl = getAbsoluteUploadUrl(post.coverImageUrl) ?? undefined;

  // images: string[] (URLs only, max 4); backward compat: legacy coverImageUrl only → images = [coverUrl]
  let imagesUrls: string[] = [];
  if (Array.isArray(post.images) && post.images.length > 0) {
    const withOrder = post.images
      .map((img: any, idx: number) => ({ url: getAbsoluteUploadUrl(img.url) ?? '', order: typeof img.order === 'number' ? img.order : idx }))
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    imagesUrls = withOrder.map((x: { url: string }) => x.url).filter(Boolean).slice(0, 4);
  } else if (coverUrl) {
    imagesUrls = [coverUrl];
  }

  const fullContent = typeof post.content === 'string' ? post.content : '';

  const result: Record<string, unknown> = {
    _id: post._id?.toString?.() ?? post._id,
    slug: post.slug,
    publicId: post.publicId,
    title: post.title,
    content: fullContent,
    excerpt: post.excerpt,
    paragraphMeta: post.paragraphMeta ?? undefined,
    aiFeaturesEnabled: post.aiFeaturesEnabled ?? true,
    category: post.category || undefined,
    tags: post.tags || [],
    coverImageUrl: coverUrl,
    imageUrl: coverUrl,
    images: imagesUrls,
    authorDisplay,
    author: { name: authorDisplay },
    likes: post.likes ?? 0,
    likeCount: post.likes ?? 0,
    likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
    commentCount: post.commentCount ?? 0,
    createdAt: post.createdAt,
    approvedAt: post.approvedAt,
    experienceLevel: post.experienceLevel || undefined,
    summary: post.summary || undefined,
    journeyId: post.journeyId?.toString?.() ?? post.journeyId ?? undefined,
    stepNumber: post.stepNumber ?? undefined,
  };
  if (post.status !== undefined) result.status = post.status;
  if (post.status === 'REJECTED') {
    result.rejectionReason = post.rejectionReason?.trim() || 'Rejected by admin';
  } else if (post.rejectionReason !== undefined && post.rejectionReason?.trim()) {
    result.rejectionReason = post.rejectionReason;
  }
  return result;
};

/**
 * Sanitize user data for admin endpoints
 * Use publicId when identifier is needed; avoid raw _id unless required internally
 * Never expose: passwordHash, password, googleId, __v, tokens
 */
export const sanitizeUserForAdmin = (user: any): any => {
  if (!user || typeof user !== 'object') {
    return user;
  }

  return {
    publicId: user.publicId,
    name: user.name,
    email: user.email,
    roles: user.roles || [],
    createdAt: user.createdAt,
  };
};

