import { Router } from 'express';
import { optionalAuthenticate } from '../auth/auth.middleware';
import { aiRateLimiter } from '../../utils/rateLimit';
import { aiHandler, paragraphAnalyzeHandler } from './ai.controller';

const router = Router();

/**
 * Paragraph analysis: suggest heading and format per paragraph (advisory only).
 * POST /api/ai/paragraph-analyze
 * Body: { content: string }
 * Returns: { paragraphs: [{ index, title, suggestedFormat }] }
 * Does NOT modify blog.content; client stores result in paragraphMeta via PUT /blog/:id.
 */
router.post('/paragraph-analyze', aiRateLimiter, optionalAuthenticate, paragraphAnalyzeHandler);

/**
 * Single AI gateway: chatbot, writing assistant, summary, reflection.
 * POST /api/ai
 * Body: { action, input, context? }
 * Auth optional (for rate limit by userId in future); token never sent to client.
 */
router.post('/', aiRateLimiter, optionalAuthenticate, aiHandler);

export default router;
