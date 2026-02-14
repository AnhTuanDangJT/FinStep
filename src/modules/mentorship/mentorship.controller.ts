import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import {
  createMentorshipRegistration,
  listMentorshipRegistrations,
  deleteMentorshipRegistration,
  isDbConnected,
} from './mentorship.service';
import { validateObjectId } from '../../utils/security';
import { registerMentorshipSchema } from './mentorship.validation';
import { exportMentorshipRegistrationsToExcel } from './mentorship.export';

/**
 * POST /api/mentorship/register – public registration.
 * Rate-limited via writeRateLimiter.
 */
export const registerMentorshipHandler = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!isDbConnected()) {
      return sendError(res, 'Service temporarily unavailable. Please try again later.', 503);
    }

    const validationResult = registerMentorshipSchema.safeParse({ body: req.body });
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    const registration = await createMentorshipRegistration(validationResult.data.body);
    return sendSuccess(res, 'Registration submitted successfully', { registration }, 201);
  } catch (e) {
    logger.error('Mentorship registration failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to submit registration', 500);
  }
};

/**
 * GET /admin/mentorship/registrations – admin list with pagination.
 * Requires authenticate + requireAdmin (handled at router level).
 */
export const listMentorshipRegistrationsHandler = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!isDbConnected()) {
      return sendError(res, 'Database not available', 503);
    }

    const rawPage = parseInt(String(req.query.page || 1), 10);
    const rawLimit = parseInt(String(req.query.limit || 20), 10);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20));

    const result = await listMentorshipRegistrations({ page, limit });
    return sendSuccess(res, 'Registrations retrieved', {
      items: result.items,
      total: result.total,
      page,
      limit,
    });
  } catch (e) {
    logger.error('List mentorship registrations failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to load registrations', 500);
  }
};

/**
 * GET /admin/mentorship/registrations/export – admin Excel download.
 * Requires authenticate + requireAdmin (handled at router level).
 */
export const exportMentorshipRegistrationsHandler = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!isDbConnected()) {
      return sendError(res, 'Database not available', 503);
    }

    const buffer = await exportMentorshipRegistrationsToExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="mentorship_registrations.xlsx"'
    );
    return res.send(buffer);
  } catch (e) {
    logger.error('Export mentorship registrations failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to export registrations', 500);
  }
};

/**
 * DELETE /admin/mentorship/registrations/:id – admin soft-delete.
 * Requires authenticate + requireAdmin (handled at router level).
 * Uses public id (from list DTO); validated as ObjectId format. Never exposes _id.
 */
export const deleteMentorshipRegistrationHandler = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!isDbConnected()) {
      return sendError(res, 'Database not available', 503);
    }

    const rawId = req.params.id;
    if (!rawId || typeof rawId !== 'string') {
      return sendError(res, 'Invalid ID format', 400);
    }

    let id: string;
    try {
      id = validateObjectId(rawId);
    } catch {
      return sendError(res, 'Invalid ID format', 400);
    }

    const deleted = await deleteMentorshipRegistration(id);
    if (!deleted) {
      return sendError(res, 'Registration not found', 404);
    }

    return sendSuccess(res, 'Registration deleted successfully', undefined, 200);
  } catch (e) {
    logger.error('Delete mentorship registration failed', e instanceof Error ? e : undefined);
    return sendError(res, 'Failed to delete registration', 500);
  }
};
