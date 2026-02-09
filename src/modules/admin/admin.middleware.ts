import { Request, Response, NextFunction } from 'express';
import { User } from '../auth/auth.model';
import { sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name?: string;
  };
}

/**
 * Admin middleware
 * Requires user to be authenticated AND have ADMIN role OR email == "dganhtuan.2k5@gmail.com"
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      sendError(res, 'Unauthorized: Authentication required', 401);
      return;
    }

    const { userId, email } = req.user;

    // Check if email is the special admin email (admin detection: spec)
    if (email === 'dganhtuan.2k5@gmail.com') {
      // Special admin - allow access; no privilege escalation possible
      if (env.NODE_ENV !== 'production') {
        logger.auth('Admin access granted', email, userId);
      }
      next();
      return;
    }

    // Fetch user from database to check roles
    const user = await User.findById(userId);

    if (!user) {
      sendError(res, 'Unauthorized: User not found', 401);
      return;
    }

    // Check if user has ADMIN role (enforced from DB; no client-set roles)
    if (user.roles && user.roles.includes('ADMIN')) {
      // Admin user - allow access
      if (env.NODE_ENV !== 'production') {
        logger.auth('Admin access granted', email, userId);
      }
      next();
      return;
    }

    // User is authenticated but not an admin
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





