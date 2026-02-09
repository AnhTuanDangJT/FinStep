import { Router } from 'express';
import { apiRateLimiter } from '../../utils/rateLimit';
import { askChatHandler } from './chat.controller';

const router = Router();

// Chat endpoint (spec: POST /chat) - finance careers, mentorship, website features; rate limited
router.post('/', apiRateLimiter, askChatHandler);
router.post('/ask', apiRateLimiter, askChatHandler); // legacy

export default router;



