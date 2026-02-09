/**
 * Profile controllers: GET/PUT /api/profile/me (auth), GET /api/users/:id and GET /api/users/:id/stats (public).
 * POST /api/users/avatar – avatar upload (auth), returns { avatarUrl } and updates User.avatarUrl.
 */
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { getAbsoluteUploadUrl, env } from '../../config/env';
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

const AVATARS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
const AVATAR_MAX_DIM = 512;

/**
 * POST /api/users/avatar – upload avatar (multipart field "avatar"), process with sharp (resize 512x512, compress),
 * save to uploads/avatars, update User.avatarUrl, return { avatarUrl }. Auth required.
 */
export async function uploadAvatarHandler(req: AuthRequest & MulterRequest, res: Response): Promise<Response> {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    if (!req.file) {
      return sendError(res, 'No file provided. Send multipart/form-data with field "avatar".', 400);
    }
    const file = req.file;
    const buffer = file.buffer;
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      return sendError(res, 'Avatar upload failed: invalid or empty file', 500);
    }
    // Ensure avatars dir exists
    if (!fs.existsSync(AVATARS_DIR)) {
      fs.mkdirSync(AVATARS_DIR, { recursive: true });
    }
    const useWebp = file.mimetype === 'image/webp';
    const ext = useWebp ? '.webp' : '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filepath = path.join(AVATARS_DIR, filename);

    let processed: Buffer;
    try {
      const pipeline = sharp(buffer)
        .resize(AVATAR_MAX_DIM, AVATAR_MAX_DIM, { fit: 'inside', withoutEnlargement: true });
      processed = await (useWebp
        ? pipeline.webp({ quality: 85 })
        : pipeline.jpeg({ quality: 85 })
      ).toBuffer();
    } catch (sharpErr) {
      logger.error('Avatar sharp processing failed, saving original', sharpErr instanceof Error ? sharpErr : undefined);
      const fallbackExt = file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
      const fallbackFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${fallbackExt}`;
      const fallbackPath = path.join(AVATARS_DIR, fallbackFilename);
      fs.writeFileSync(fallbackPath, buffer);
      const relativePath = `/uploads/avatars/${fallbackFilename}`;
      const absoluteUrl = getAbsoluteUploadUrl(relativePath) || `http://localhost:${env.PORT}${relativePath}`;
      await setUserAvatarUrl(req.user.userId, absoluteUrl);
      logger.info('Avatar uploaded (fallback)', { userId: req.user.userId, avatarUrl: absoluteUrl });
      return sendSuccess(res, 'Avatar uploaded successfully', { avatarUrl: absoluteUrl }, 200);
    }

    fs.writeFileSync(filepath, processed);
    const relativePath = `/uploads/avatars/${filename}`;
    const absoluteUrl = getAbsoluteUploadUrl(relativePath) || `http://localhost:${env.PORT}${relativePath}`;
    await setUserAvatarUrl(req.user.userId, absoluteUrl);
    logger.info('Avatar uploaded', { userId: req.user.userId, avatarUrl: absoluteUrl });
    return sendSuccess(res, 'Avatar uploaded successfully', { avatarUrl: absoluteUrl }, 200);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Avatar upload failed';
    logger.error('Avatar upload failed', e instanceof Error ? e : undefined);
    const message = env.NODE_ENV === 'production' ? 'Avatar upload failed' : errMsg;
    return sendError(res, message, 500);
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
