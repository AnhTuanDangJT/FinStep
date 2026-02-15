/**
 * Profile controllers: GET/PUT /api/profile/me (auth), GET /api/users/:id and GET /api/users/:id/stats (public).
 * POST /api/users/avatar – avatar upload (auth), returns { avatarUrl } and updates User.avatarUrl.
 */
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { uploadAvatar } from '../upload/upload.service';
import {
  getProfileMe,
  updateProfileMe,
  getPublicProfile,
  getUserStats,
  setUserAvatarUrl,
  deleteAccount,
  type UpdateProfileInput,
} from './profile.service';
import { updateProfileSchema, updateThemeSchema, deleteAccountSchema } from './profile.validator';

interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/** GET /api/profile/me – current user full editable profile (auth required). */
export async function getProfileMeHandler(req: AuthRequest, res: Response): Promise<Response> {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const profile = await getProfileMe(req.user.userId);
    if (!profile) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'Profile retrieved', profile, 200);
  } catch (e) {
    logger.error('Failed to get profile', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve profile', 500);
  }
}

/** PUT /api/profile/me – update current user profile (auth required). */
export async function updateProfileMeHandler(req: AuthRequest, res: Response): Promise<Response> {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({ field: err.path.join('.'), message: err.message }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }
    const input: UpdateProfileInput = parsed.data;
    const profile = await updateProfileMe(req.user.userId, input);
    if (!profile) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'Profile updated', profile, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update profile';
    if (msg.includes('300') || msg.includes('3 items')) return sendError(res, msg, 400);
    logger.error('Failed to update profile', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to update profile', 500);
  }
}

/**
 * POST /api/users/avatar – upload avatar, save to Cloudinary, update User.avatarUrl.
 */
export async function uploadAvatarHandler(req: AuthRequest & MulterRequest, res: Response): Promise<Response> {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    if (!req.file) {
      return sendError(res, 'No file provided. Send multipart/form-data with field "avatar".', 400);
    }
    const file = req.file as Express.Multer.File & { buffer?: Buffer };
    if (!file.buffer) {
      return sendError(res, 'Avatar upload failed: no buffer', 500);
    }

    const result = await uploadAvatar(file);

    await setUserAvatarUrl(req.user.userId, result.url);
    logger.info('Avatar uploaded', { userId: req.user.userId, avatarUrl: result.url });
    return sendSuccess(res, 'Avatar uploaded successfully', { avatarUrl: result.url }, 200);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Avatar upload failed';
    logger.error('Avatar upload failed', e instanceof Error ? e : undefined);
    const message = env.NODE_ENV === 'production' && !errMsg.includes('Invalid') ? 'Avatar upload failed' : errMsg;
    return sendError(res, message, errMsg.includes('Invalid') ? 400 : 500);
  }
}

/** DELETE /api/profile/me – delete current user's account (auth required). Body: { confirm: "DELETE" }. */
export async function deleteAccountHandler(req: AuthRequest, res: Response): Promise<Response> {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const parsed = deleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        'Confirmation required. Send body: { "confirm": "DELETE" } to delete your account.',
        400
      );
    }
    const deleted = await deleteAccount(req.user.userId);
    if (!deleted) return sendError(res, 'User not found', 404);
    logger.info('User account deleted', { userId: req.user.userId, email: req.user.email });
    return sendSuccess(res, 'Account deleted', {}, 200);
  } catch (e) {
    logger.error('Delete account failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to delete account', 500);
  }
}

/** PUT /api/profile/me/theme – update theme preference only (auth required). */
export async function updateThemeHandler(req: AuthRequest, res: Response): Promise<Response> {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const parsed = updateThemeSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({ field: err.path.join('.'), message: err.message }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }
    const profile = await updateProfileMe(req.user.userId, { themePreference: parsed.data.themePreference });
    if (!profile) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'Theme updated', profile, 200);
  } catch (e) {
    logger.error('Failed to update theme', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to update theme', 500);
  }
}

/** GET /api/users/:id – public read-only profile (no email). */
export async function getPublicProfileHandler(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.params.id;
    if (!userId) return sendError(res, 'User ID required', 400);
    const profile = await getPublicProfile(userId);
    if (!profile) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'Profile retrieved', profile, 200);
  } catch (e) {
    logger.error('Failed to get public profile', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve profile', 500);
  }
}

/** GET /api/users/:id/stats – public activity stats. */
export async function getUserStatsHandler(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.params.id;
    if (!userId) return sendError(res, 'User ID required', 400);
    const stats = await getUserStats(userId);
    if (!stats) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'Stats retrieved', stats, 200);
  } catch (e) {
    logger.error('Failed to get user stats', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to retrieve stats', 500);
  }
}
