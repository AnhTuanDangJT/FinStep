import { z } from 'zod';

const titleSchema = z
  .string({ required_error: 'Title is required' })
  .min(1, 'Title must not be empty')
  .max(200, 'Title must be less than 200 characters')
  .trim();

/** Content must NOT be trimmed - preserve newlines and paragraph structure exactly. */
const contentSchema = z
  .string({ required_error: 'Content is required' })
  .min(1, 'Content must not be empty');

const excerptSchema = z
  .string()
  .min(1, 'Excerpt must not be empty')
  .max(500, 'Excerpt must be less than 500 characters')
  .trim()
  .optional()
  .or(z.literal(''));

const tagsSchema = z
  .array(z.string().trim())
  .default([])
  .optional();

const categorySchema = z.string().trim().max(100).optional().or(z.literal(''));

// Accept full URLs (http/https) or relative paths (/uploads/...) for backward compatibility
const coverImageUrlSchema = z
  .string()
  .refine(
    (v) => !v || v === '' || v.startsWith('http') || v.startsWith('/'),
    'Cover image must be a URL or path starting with /'
  )
  .optional()
  .or(z.literal(''));

/** Images: array of non-empty URL strings; max 4; empty array allowed */
const imagesSchema = z
  .array(z.string().min(1, 'Each image URL must be non-empty'))
  .max(4, 'At most 4 images allowed')
  .optional()
  .default([]);

/**
 * Create blog validation schema (JSON body)
 */
export const createBlogSchema = z.object({
  body: z.object({
    title: titleSchema,
    content: contentSchema,
    excerpt: excerptSchema,
    category: categorySchema,
    tags: tagsSchema,
    coverImageUrl: coverImageUrlSchema,
    images: imagesSchema,
  }).strict(),
});

/**
 * Parse and validate create blog body from request (supports JSON or FormData string fields)
 */
export function parseCreateBlogBody(body: Record<string, unknown>): z.infer<typeof createBlogSchema>['body'] {
  let tags: string[] = [];
  if (Array.isArray(body.tags)) {
    tags = body.tags.map(String).map((s) => s.trim()).filter(Boolean);
  } else if (typeof body.tags === 'string' && body.tags.trim()) {
    try {
      const parsed = JSON.parse(body.tags);
      tags = Array.isArray(parsed) ? parsed.map(String).map((s) => s.trim()).filter(Boolean) : [];
    } catch {
      tags = body.tags.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  let images: string[] = [];
  if (Array.isArray(body.images)) {
    images = body.images.map((u) => (typeof u === 'string' ? u.trim() : String(u))).filter(Boolean);
  } else if (typeof body.images === 'string' && body.images.trim()) {
    try {
      const parsed = JSON.parse(body.images);
      images = Array.isArray(parsed) ? parsed.map(String).map((s) => s.trim()).filter(Boolean) : [];
    } catch {
      images = [];
    }
  }
  if (images.length > 4) {
    throw new Error('At most 4 images allowed');
  }

  const parsed = z.object({
    title: titleSchema,
    content: contentSchema,
    excerpt: excerptSchema.optional(),
    category: categorySchema.optional(),
    tags: z.array(z.string().trim()).optional(),
    coverImageUrl: coverImageUrlSchema.optional(),
    images: imagesSchema,
  }).strict().parse({
    title: typeof body.title === 'string' ? body.title : String(body.title ?? ''),
    content: typeof body.content === 'string' ? body.content : String(body.content ?? ''),
    excerpt: typeof body.excerpt === 'string' ? body.excerpt : (body.excerpt != null ? String(body.excerpt) : ''),
    category: typeof body.category === 'string' ? body.category : undefined,
    tags,
    coverImageUrl: typeof body.coverImageUrl === 'string' ? body.coverImageUrl : undefined,
    images,
  });
  return {
    ...parsed,
    excerpt: parsed.excerpt && parsed.excerpt.trim() ? parsed.excerpt : undefined,
    category: parsed.category && parsed.category.trim() ? parsed.category : undefined,
    tags: parsed.tags?.length ? parsed.tags : [],
    coverImageUrl: parsed.coverImageUrl && parsed.coverImageUrl.trim() ? parsed.coverImageUrl : undefined,
    images: parsed.images?.length ? parsed.images.slice(0, 4) : [],
  };
}

/**
 * Approve blog validation schema (admin)
 */
export const approveBlogSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Blog ID is required'),
  }),
});

/**
 * Reject blog validation schema (admin)
 * rejectionReason is required when rejecting.
 */
export const rejectBlogSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Blog ID is required'),
  }),
  body: z.object({
    reason: z
      .string({ required_error: 'Rejection reason is required' })
      .min(1, 'Rejection reason must not be empty')
      .trim(),
  }).strict(),
});

/**
 * Like blog validation schema
 */
export const likeBlogSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Blog ID is required'),
  }),
});

/**
 * Update blog validation schema (all fields optional)
 */
export const updateBlogSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Blog ID is required'),
  }),
  body: z
    .object({
      title: z.string().min(1).max(200).trim().optional(),
      content: z.string().min(1).optional(),
      excerpt: z.string().max(500).trim().optional(),
      category: categorySchema.optional(),
      tags: tagsSchema,
      coverImageUrl: coverImageUrlSchema.optional(),
      images: imagesSchema,
      paragraphMeta: z
        .object({
          paragraphs: z.array(
            z.object({
              index: z.number().int().min(0),
              aiTitle: z.string().nullable().optional(),
              title: z.string().nullable().optional(),
              suggestedFormat: z.enum(['paragraph', 'bullet']).optional(),
            })
          ),
        })
        .optional(),
      aiFeaturesEnabled: z.boolean().optional(),
    })
    .strict(),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>['body'];
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>['body'];



