import { Router, type RequestHandler } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { stripForbiddenFields } from '../../utils/security';
import { getProfileMeHandler, updateProfileMeHandler, updateThemeHandler, deleteAccountHandler } from './profile.controller';

const router = Router();

/** GET /api/profile/me – current user full profile (auth required). */
router.get('/me', authenticate, getProfileMeHandler as RequestHandler);

/** PUT /api/profile/me – update current user profile (auth required). */
router.put('/me', authenticate, stripForbiddenFields, updateProfileMeHandler as RequestHandler);

/** PUT /api/profile/me/theme – update theme preference { themePreference: "light" | "dark" } (auth required). */
router.put('/me/theme', authenticate, updateThemeHandler as RequestHandler);

/** DELETE /api/profile/me – delete current user's account. Body: { confirm: "DELETE" } (auth required). */
router.delete('/me', authenticate, deleteAccountHandler as RequestHandler);

export default router;
