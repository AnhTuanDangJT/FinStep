import { Router, type RequestHandler } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { stripForbiddenFields } from '../../utils/security';
import { getMentorInfoHandler, getPrimaryMentorHandler, getMentorProfilesHandler, upsertMentorProfileHandler } from './mentor.controller';

const router = Router();

// Public routes (guest-access allowed)
router.get('/primary', getPrimaryMentorHandler);
router.get('/info', getMentorInfoHandler);
router.get('/profiles', getMentorProfilesHandler);

// Authenticated: create/update own mentor profile
router.post('/profile', authenticate as RequestHandler, stripForbiddenFields, upsertMentorProfileHandler as RequestHandler);
router.put('/profile', authenticate as RequestHandler, stripForbiddenFields, upsertMentorProfileHandler as RequestHandler);

export default router;



