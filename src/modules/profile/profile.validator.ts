import { z } from 'zod';

const imageUrlRegex = /\.(jpe?g|png|gif|webp)(\?.*)?$/i;
const allowedProtocols = /^https?:\/\//i;

/** Validates avatarUrl is an image URL (extension or path). Empty string clears. */
function isValidImageUrl(url: string): boolean {
  if (!url || url.trim() === '') return true;
  try {
    if (!allowedProtocols.test(url.trim())) return false;
    const u = new URL(url);
    const pathname = u.pathname || '';
    return imageUrlRegex.test(pathname) || pathname.includes('/image/') || pathname.includes('/upload/');
  } catch {
    return false;
  }
}

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().max(120).optional(),
    avatarUrl: z
      .string()
      .trim()
      .refine(isValidImageUrl, { message: 'avatarUrl must be a valid image URL (e.g. from upload)' })
      .optional(),
    bio: z.string().trim().max(300, 'Bio must not exceed 300 characters').optional(),
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    focusAreas: z
      .array(z.enum(['PersonalFinance', 'Investing', 'Career', 'SideHustle']))
      .max(3, 'focusAreas must have at most 3 items')
      .optional(),
    location: z.string().trim().max(100).optional(),
    themePreference: z.enum(['light', 'dark']).optional(),
  })
  .strict();

export const updateThemeSchema = z
  .object({
    themePreference: z.enum(['light', 'dark']),
  })
  .strict();

/** DELETE /api/profile/me – body must include confirm: "DELETE" to prevent accidents. */
export const deleteAccountSchema = z
  .object({
    confirm: z.literal('DELETE'),
  })
  .strict();

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
