import { Request, Response, NextFunction } from 'express';
import { User } from '../auth/auth.model';
import { sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name?: string;
  };
}

/**
 * Admin middleware
 * Requires user to be authenticated AND role === "admin" (or email === dganhtuan.2k5@gmail.com as super admin).
 * Role is synced from DB on login; only dganhtuan.2k5@gmail.com is super admin.
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized: Authentication required', 401);
      return;
    }

    const { userId, email } = req.user;

    // Super admin (only dganhtuan.2k5@gmail.com) - always allowed
    if (email === 'dganhtuan.2k5@gmail.com') {
      next();
      return;
    }

    const user = await User.findById(userId).select('role roles').lean();
    if (!user) {
      sendError(res, 'Unauthorized: User not found', 401);
      return;
    }

    // Check role (primary) or roles (backward compat)
    const isAdmin = user.role === 'admin' || (user.roles && user.roles.includes('ADMIN'));
    if (isAdmin) {
      next();
      return;
    }

    logger.authError('Admin access denied', 'User is not an admin', email);
    sendError(res, 'Forbidden: Admin access required', 403);
  } catch (error) {
    logger.error('Admin middleware error', error instanceof Error ? error : undefined);
    sendError(res, 'Internal server error', 500);
  }
};

const SUPER_ADMIN_EMAIL = 'dganhtuan.2k5@gmail.com';

/**
 * Super admin middleware – only for adding/removing admins.
 * Only the email "dganhtuan.2k5@gmail.com" is super admin.
 */
export const requireSuperAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized: Authentication required', 401);
      return;
    }
    if (req.user.email !== SUPER_ADMIN_EMAIL) {
      logger.authError('Super admin access denied', 'Only super admin can add/remove admins', req.user.email);
      sendError(res, 'Forbidden: Super admin access required', 403);
      return;
    }
    next();
  } catch (error) {
    logger.error('Super admin middleware error', error instanceof Error ? error : undefined);
    sendError(res, 'Internal server error', 500);
  }
};





