import { Router, type RequestHandler } from 'express';
import { registerMentorshipHandler } from './mentorship.controller';
import { writeRateLimiter } from '../../utils/rateLimit';

const router = Router();

// POST /api/mentorship/register – public, rate-limited
router.post('/register', writeRateLimiter as RequestHandler, registerMentorshipHandler as RequestHandler);

export default router;
