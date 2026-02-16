/**
 * Public DTO / Serializer layer
 * NEVER expose _id, raw email, authorId, or internal identifiers in public APIs.
 */

import { getAbsoluteUploadUrl } from '../config/env';

/** Mask email for public display: "j***@example.com" */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '***@***';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const masked = local.length <= 2 ? '**' : local[0] + '***' + local[local.length - 1];
  return `${masked}@${domain}`;
}

/** Round createdAt to day (ISO date string) for privacy */
export function roundDateToDay(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split('T')[0];
}

/** Public User DTO – only safe fields. NEVER return _id, raw email, admin metadata. */
export interface PublicUserDto {
  publicId: string;
  emailMasked: string;
  displayName: string;
  credibilityLevel?: string;
  avatarUrlPublic?: string;
  createdAtRounded?: string;
}

export function toPublicUserDto(user: {
  publicId?: string;
  _id?: unknown;
  email?: string;
  displayName?: string;
  name?: string;
  credibilityLevel?: string;
  avatarUrl?: string;
  createdAt?: Date | string;
}): PublicUserDto {
  const publicId = user.publicId || (user._id && typeof user._id === 'object' && 'toString' in user._id ? (user._id as { toString(): string }).toString() : '');
  return {
    publicId: typeof publicId === 'string' ? publicId : String(publicId),
    emailMasked: maskEmail(user.email || ''),
    displayName: (user.displayName || user.name || 'User').trim() || 'User',
    credibilityLevel: user.credibilityLevel || undefined,
    avatarUrlPublic: user.avatarUrl ? getAbsoluteUploadUrl(user.avatarUrl) : undefined,
    createdAtRounded: roundDateToDay(user.createdAt),
  };
}

/** Public Blog Feed DTO – for list/cards. NO authorId, NO author._id. */
export interface PublicBlogFeedDto {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl?: string;
  authorDisplay: string; // masked email or display name
  createdAt: string;
  tags: string[];
  stats: { likes: number; commentCount?: number };
  publicId?: string;
}

export function toPublicBlogFeedDto(post: {
  slug?: string;
  title?: string;
  excerpt?: string;
  coverImageUrl?: string;
  author?: { email?: string; name?: string; displayName?: string };
  createdAt?: Date | string;
  tags?: string[];
  likes?: number;
  commentCount?: number;
  publicId?: string;
}): PublicBlogFeedDto {
  const authorDisplay = (post.author?.displayName || post.author?.name || maskEmail(post.author?.email || '')).trim() || 'Author';
  const coverUrl = post.coverImageUrl ? getAbsoluteUploadUrl(post.coverImageUrl) : undefined;
  const createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
  return {
    slug: post.slug || '',
    title: post.title || '',
    excerpt: post.excerpt || '',
    coverImageUrl: coverUrl,
    authorDisplay,
    createdAt,
    tags: Array.isArray(post.tags) ? post.tags : [],
    stats: {
      likes: typeof post.likes === 'number' ? post.likes : 0,
      commentCount: typeof post.commentCount === 'number' ? post.commentCount : undefined,
    },
    publicId: post.publicId,
  };
}

/** Public Blog Detail DTO – full post with content. NO authorId, NO raw email. */
export interface PublicBlogDetailDto {
  slug: string;
  publicId?: string;
  title: string;
  content: string;
  excerpt: string;
  coverImageUrl?: string;
  images?: string[];
  authorDisplay: string;
  createdAt: string;
  tags: string[];
  stats: { likes: number; commentCount?: number };
  category?: string;
  experienceLevel?: string;
  summary?: string;
  status?: string;
  rejectionReason?: string;
  paragraphMeta?: unknown;
  aiFeaturesEnabled?: boolean;
}

export function toPublicBlogDetailDto(post: {
  slug?: string;
  publicId?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  coverImageUrl?: string;
  images?: { url: string; order?: number }[];
  author?: { email?: string; name?: string; displayName?: string };
  createdAt?: Date | string;
  tags?: string[];
  likes?: number;
  commentCount?: number;
  category?: string;
  experienceLevel?: string;
  summary?: string;
  status?: string;
  rejectionReason?: string;
  paragraphMeta?: unknown;
  aiFeaturesEnabled?: boolean;
}): PublicBlogDetailDto {
  const authorDisplay = (post.author?.displayName || post.author?.name || maskEmail(post.author?.email || '')).trim() || 'Author';
  const coverUrl = post.coverImageUrl ? getAbsoluteUploadUrl(post.coverImageUrl) : undefined;
  let images: string[] = [];
  if (Array.isArray(post.images) && post.images.length > 0) {
    images = post.images
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((img) => getAbsoluteUploadUrl(img.url))
      .filter((v): v is string => Boolean(v));
  } else if (coverUrl) {
    images = [coverUrl];
  }
  const createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
  return {
    slug: post.slug || '',
    publicId: post.publicId,
    title: post.title || '',
    content: post.content || '',
    excerpt: post.excerpt || '',
    coverImageUrl: coverUrl,
    images: images.length > 0 ? images : undefined,
    authorDisplay,
    createdAt,
    tags: Array.isArray(post.tags) ? post.tags : [],
    stats: {
      likes: typeof post.likes === 'number' ? post.likes : 0,
      commentCount: typeof post.commentCount === 'number' ? post.commentCount : undefined,
    },
    category: post.category,
    experienceLevel: post.experienceLevel,
    summary: post.summary,
    status: post.status,
    rejectionReason: post.rejectionReason,
    paragraphMeta: post.paragraphMeta,
    aiFeaturesEnabled: post.aiFeaturesEnabled,
  };
}
