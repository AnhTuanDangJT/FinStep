import { z } from 'zod';

/**
 * Create post validation schema
 */
export const createPostSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: 'Title is required',
      })
      .min(1, 'Title must not be empty')
      .max(200, 'Title must be less than 200 characters')
      .trim(),
    content: z
      .string({
        required_error: 'Content is required',
      })
      .min(1, 'Content must not be empty'),
    excerpt: z
      .string()
      .min(1, 'Excerpt must not be empty')
      .max(500, 'Excerpt must be less than 500 characters')
      .trim()
      .optional()
      .default(''),
    tags: z
      .array(z.string().trim())
      .default([])
      .optional(),
    coverImageUrl: z
      .string()
      .refine((v) => !v || v === '' || v.startsWith('http') || v.startsWith('/'), 'Cover image must be URL or path')
      .optional()
      .default(''),
    images: z
      .array(
        z.union([
          z.string().min(1, 'Image URL must be non-empty'),
          z.object({ url: z.string().min(1), order: z.number().int().min(0).optional() }),
        ])
      )
      .max(4, 'At most 4 images allowed')
      .optional()
      .default([]),
    journeyId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    stepNumber: z.number().int().min(1).optional().nullable(),
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    category: z.string().trim().optional(),
    summary: z.string().max(2000).trim().optional(),
  }).strict(), // Reject unknown fields to prevent privilege escalation
});

/**
 * Update post validation schema
 */
export const updatePostSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title must not be empty')
      .max(200, 'Title must be less than 200 characters')
      .trim()
      .optional(),
    content: z
      .string()
      .min(1, 'Content must not be empty')
      .optional(),
    excerpt: z
      .string()
      .min(1, 'Excerpt must not be empty')
      .max(500, 'Excerpt must be less than 500 characters')
      .trim()
      .optional(),
    tags: z
      .array(z.string().trim())
      .optional(),
    coverImageUrl: z
      .string()
      .refine((v) => !v || v === '' || v.startsWith('http') || v.startsWith('/'), 'Cover image must be URL or path')
      .optional()
      .default(''),
    images: z.array(z.string().min(1, 'Each image URL must be non-empty')).max(4, 'At most 4 images allowed').optional(),
    journeyId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    stepNumber: z.number().int().min(1).optional().nullable(),
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    category: z.string().trim().optional(),
    summary: z.string().max(2000).trim().optional(),
    paragraphMeta: z
      .object({
        paragraphs: z.array(
          z.object({
            index: z.number().int().min(0),
            aiTitle: z.string().nullable().optional(),
            title: z.string().nullable().optional(), // from AI output; stored as aiTitle
            suggestedFormat: z.enum(['paragraph', 'bullet']).optional(),
          })
        ),
      })
      .optional(),
    aiFeaturesEnabled: z.boolean().optional(),
  }).strict(), // Reject unknown fields to prevent privilege escalation
});

/**
 * Approve post validation schema (admin)
 */
export const approvePostSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Post ID is required'),
  }),
});

/**
 * Reject post validation schema (admin)
 * rejectionReason is required when rejecting.
 */
export const rejectPostSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Post ID is required'),
  }),
  body: z.object({
    reason: z
      .string({ required_error: 'Rejection reason is required' })
      .min(1, 'Rejection reason must not be empty')
      .trim(),
  }).strict(),
});

/**
 * Comment validation schema
 */
export const commentPostSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Post ID is required'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .min(1, 'Content must not be empty')
      .max(2000, 'Content must be less than 2000 characters')
      .trim(),
  }).strict(),
});

/**
 * Post update (living post) validation
 */
export const postUpdateNoteSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    updateNote: z.string().min(1, 'Update note is required').max(2000).trim(),
  }).strict(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>['body'];
export type UpdatePostInput = z.infer<typeof updatePostSchema>['body'];

