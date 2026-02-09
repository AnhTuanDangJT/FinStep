import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';
import { sanitizePublicPost } from '../../utils/security';
import { createJourney, getJourneyById, getJourneyPosts, getJourneySteps, getDefaultJourney } from './journey.service';
import { createJourneySchema } from './journey.validator';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string; name?: string };
}

/**
 * POST /api/journeys – create journey (auth required)
 */
export const createJourneyHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const validationResult = createJourneySchema.safeParse(req);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const journey = await createJourney(req.user.userId, validationResult.data.body);
    return sendSuccess(res, 'Journey created', { journey }, 201);
  } catch (e) {
    logger.error('Create journey failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to create journey', 500);
  }
};

/**
 * GET /api/journeys/:id – get journey with steps (postId, postSlug for /blogs/:slug)
 * Owner always; others only if isPublic. Steps are APPROVED-only for non-owners.
 */
export const getJourneyHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Journey not found', 404);
    }
    const journey = await getJourneyById(id);
    if (!journey) return sendError(res, 'Journey not found', 404);
    const isOwner = req.user?.userId === journey.userId;
    if (!isOwner && !journey.isPublic) return sendError(res, 'Journey not found', 404);
    const approvedOnly = !isOwner || !req.user;
    const steps = await getJourneySteps(id, { approvedOnly });
    return sendSuccess(res, 'Journey retrieved', { journey, steps }, 200);
  } catch (e) {
    logger.error('Get journey failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to get journey', 500);
  }
};

/**
 * GET /api/journeys/default – default FinStep journey with steps (postId, postSlug). Public.
 */
export const getDefaultJourneyHandler = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const result = await getDefaultJourney();
    if (!result) return sendError(res, 'Journey not found', 404);
    return sendSuccess(res, 'Journey retrieved', {
      journey: result.journey,
      steps: result.steps,
    }, 200);
  } catch (e) {
    logger.error('Get default journey failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to get journey', 500);
  }
};

/**
 * GET /api/journeys/:id/posts – timeline of posts (ordered by stepNumber, then createdAt)
 * Public if journey isPublic (APPROVED only); owner sees all statuses when authenticated.
 */
export const getJourneyPostsHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Journey not found', 404);
    }
    const journey = await getJourneyById(id);
    if (!journey) return sendError(res, 'Journey not found', 404);
    const isOwner = req.user?.userId === journey.userId;
    const approvedOnly = !isOwner || !req.user;
    const posts = await getJourneyPosts(id, { approvedOnly });
    const sanitized = posts.map((p) => sanitizePublicPost(p));
    return sendSuccess(res, 'Posts retrieved', { posts: sanitized, journeyId: id }, 200);
  } catch (e) {
    logger.error('Get journey posts failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to get journey posts', 500);
  }
};
