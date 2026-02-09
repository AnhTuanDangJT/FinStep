/**
 * User routes: POST /api/users/avatar (auth), GET /api/users/:id (public profile), GET /api/users/:id/stats (activity stats).
 */
import { Router, type RequestHandler } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { getPublicProfileHandler, getUserStatsHandler, uploadAvatarHandler } from './profile.controller';

const router = Router();

/** POST /api/users/avatar – upload avatar (auth required). Field "avatar", multipart. Returns { avatarUrl }. */
// Multer runs in app.ts before body parsers for this path so the multipart stream is not consumed.
router.post('/avatar', authenticate as RequestHandler, uploadAvatarHandler as RequestHandler);

/** GET /api/users/:id – public read-only profile. */
router.get('/:id', getPublicProfileHandler as RequestHandler);

/** GET /api/users/:id/stats – public activity stats. */
router.get('/:id/stats', getUserStatsHandler as RequestHandler);

export default router;
