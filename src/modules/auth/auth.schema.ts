import { z } from 'zod';

/**
 * Registration validation schema
 * Frontend should send: { name: string, email: string, password: string }
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Name is required',
      })
      .min(1, 'Name must not be empty')
      .trim(),
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please provide a valid email')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(8, 'Password must be at least 8 characters'),
  }).strict(), // Reject unknown fields to prevent privilege escalation
});

/**
 * Login validation schema
 * Frontend should send: { email: string, password: string }
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please provide a valid email')
      .toLowerCase()
      .trim(),
    password: z.string({
      required_error: 'Password is required',
    }),
  }).strict(), // Reject unknown fields to prevent privilege escalation
});

/**
 * Update profile validation schema
 */
export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'Name must not be empty').trim().optional(),
      linkedInUrl: z
        .union([z.string().url('LinkedIn URL must be valid'), z.literal('')])
        .optional(),
    })
    .strict(),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];

