import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { getMentorInfo, getPrimaryMentor, listMentorProfiles, upsertMentorProfile } from './mentor.service';

/**
 * Get primary mentor (public) – for /mentor page: name, fields, bio, whyMentor, ctaUrl
 * GET /api/mentor/primary
 */
export const getPrimaryMentorHandler = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const data = await getPrimaryMentor();
    return sendSuccess(res, 'Primary mentor retrieved', data, 200);
  } catch (error) {
    logger.error('Failed to get primary mentor', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve mentor', 500);
  }
};

/**
 * Get mentor information (public) – legacy single mentor
 * GET /mentor/info
 */
export const getMentorInfoHandler = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const mentorInfo = await getMentorInfo();
    return sendSuccess(res, 'Mentor information retrieved successfully', mentorInfo, 200);
  } catch (error) {
    logger.error('Failed to get mentor info', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve mentor information', 500);
  }
};

/**
 * List mentor profiles with verification and role badges (public)
 * GET /mentor/profiles
 */
export const getMentorProfilesHandler = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const profiles = await listMentorProfiles();
    return sendSuccess(res, 'Mentor profiles retrieved', { profiles }, 200);
  } catch (error) {
    logger.error('Failed to get mentor profiles', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to retrieve mentor profiles', 500);
  }
};

interface MentorProfileRequest extends Request {
  user?: { userId: string };
}

/** Create or update own mentor profile (auth required) */
export const upsertMentorProfileHandler = async (req: MentorProfileRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    const pathTitle = req.body?.pathTitle;
    if (!pathTitle || typeof pathTitle !== 'string' || !pathTitle.trim()) {
      return sendError(res, 'pathTitle is required', 400);
    }
    const profile = await upsertMentorProfile(req.user.userId, {
      pathTitle: pathTitle.trim(),
      description: req.body?.description,
      contactLink: req.body?.contactLink,
    });
    return sendSuccess(res, 'Mentor profile saved', {
      profile: {
        userId: profile.userId,
        pathTitle: profile.pathTitle,
        description: profile.description,
        contactLink: profile.contactLink,
        verified: profile.verified,
      },
    }, 200);
  } catch (error) {
    logger.error('Failed to save mentor profile', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to save mentor profile', 500);
  }
};



