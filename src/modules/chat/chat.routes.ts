import { Router } from 'express';
import { chatRateLimiter } from '../../utils/rateLimit';
import { askChatHandler } from './chat.controller';

const router = Router();

// Chat endpoint (spec: POST /chat) - finance careers, mentorship, website features; stricter rate limit
router.post('/', chatRateLimiter, askChatHandler);
router.post('/ask', chatRateLimiter, askChatHandler); // legacy

export default router;



