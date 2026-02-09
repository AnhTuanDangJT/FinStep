import { Router, type RequestHandler } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { createJourneyHandler, getJourneyHandler, getJourneyPostsHandler, getDefaultJourneyHandler } from './journey.controller';

const router = Router();

router.get('/default', getDefaultJourneyHandler as RequestHandler); // public default journey + steps
router.post('/', authenticate as RequestHandler, createJourneyHandler as RequestHandler);
router.get('/:id/posts', getJourneyPostsHandler as RequestHandler); // optional auth in handler
router.get('/:id', getJourneyHandler as RequestHandler);           // optional auth in handler

export default router;
