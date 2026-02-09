import { z } from 'zod';

/**
 * Add admin validation schema
 */
export const addAdminSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please provide a valid email')
      .toLowerCase()
      .trim(),
  }).strict(), // Reject unknown fields to prevent privilege escalation
});

export type AddAdminInput = z.infer<typeof addAdminSchema>['body'];

/**
 * PATCH /api/admin/blogs/:id/review
 * status: APPROVED | REJECTED; rejectionReason required when REJECTED.
 */
export const reviewBlogSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Blog ID is required'),
  }),
  body: z
    .object({
      status: z.enum(['APPROVED', 'REJECTED'], {
        required_error: 'status is required',
        invalid_type_error: 'status must be APPROVED or REJECTED',
      }),
      rejectionReason: z.string().trim().optional(),
    })
    .strict(),
});

export type ReviewBlogInput = z.infer<typeof reviewBlogSchema>;

export const removeAdminSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
  }).strict(),
});

export const softBanSchema = z.object({
  params: z.object({ userId: z.string().min(1) }),
  body: z.object({
    banned: z.boolean(),
  }).strict(),
});

export const credibilitySchema = z.object({
  params: z.object({ userId: z.string().min(1) }),
  body: z.object({
    level: z.enum(['beginner', 'contributor', 'trusted_writer', 'mentor']),
  }).strict(),
});

export const addNoteSchema = z.object({
  body: z.object({
    targetType: z.enum(['user', 'blog']),
    targetId: z.string().min(1),
    note: z.string().min(1, 'Note is required').max(5000),
  }).strict(),
});

/** POST /admin/adjust-credibility  Body: { userId: string, score: number (0-100) } */
export const adjustCredibilitySchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'userId is required'),
    score: z.number().min(0).max(100),
  }).strict(),
});

/** POST /admin/suspend-user  Body: { userId: string, setCredibilityToZero?: boolean } */
export const suspendUserSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'userId is required'),
    setCredibilityToZero: z.boolean().optional(),
  }).strict(),
});

/** POST /admin/blogs/:id/grade  Body: { grade: number(0..100), reason?: string, regrade?: boolean } */
export const gradeBlogSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Blog id is required') }),
  body: z.object({
    grade: z.number().int().min(0).max(100),
    reason: z.string().trim().max(2000).optional(),
    regrade: z.boolean().optional(),
  }).strict(),
});

/** POST /admin/users/:userId/credibility  Body: { score: number (0-100), reason: string } — manual admin adjustment by user id/publicId */
export const adjustCredibilityByUserIdSchema = z.object({
  params: z.object({ userId: z.string().min(1, 'userId is required') }),
  body: z.object({
    score: z.number().min(0).max(100),
    reason: z.string().min(1, 'Reason is required').max(2000).trim(),
  }).strict(),
});

/** POST /admin/users/adjust-credibility  Body: { targetEmail, delta, reason } */
export const adjustCredibilityByEmailSchema = z.object({
  body: z.object({
    targetEmail: z.string().email('Invalid target email').toLowerCase().trim(),
    delta: z.number().int(),
    reason: z.string().min(1, 'Reason is required').max(2000).trim(),
  }).strict(),
});

/** POST /admin/users/promote-admin  Body: { targetEmail } — SUPER_ADMIN only */
export const promoteAdminSchema = z.object({
  body: z.object({
    targetEmail: z.string().email('Invalid email').toLowerCase().trim(),
  }).strict(),
});

