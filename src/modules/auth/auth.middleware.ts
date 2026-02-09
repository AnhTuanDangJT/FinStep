import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import { sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

/**
 * Authentication middleware
 * Protects routes that require authentication
 * 
 * Token can be provided in two ways (checked in order):
 * 1. HTTP-only cookie: accessToken (preferred for browser-based clients)
 * 2. Authorization header: Bearer <access_token> (for API clients)
 * 
 * NOTE: This middleware should ONLY be applied to protected routes.
 * Public routes (register, login, OAuth) should NOT use this middleware.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Defensive check: If this middleware is somehow called on a public route,
    // it indicates a routing configuration error. Log warning but don't block.
    // Note: req.path is relative to the router mount point, so for /auth routes,
    // the path will be like '/register' or '/login', not '/auth/register'
    const path = req.path || req.url || '';
    const publicRoutes = ['/register', '/login', '/google', '/google/callback'];
    // Check if path matches any public route (exact match or starts with)
    const isPublicRoute = publicRoutes.some(route => 
      path === route || path.startsWith(route + '/') || path.includes(route)
    );
    
    if (isPublicRoute) {
      // This should never happen if routes are configured correctly
      // If it does, it means authenticate middleware was incorrectly applied
      if (env.NODE_ENV !== 'production') {
        logger.error(
          'Auth middleware incorrectly applied to public route',
          new Error(`Path: ${path}, URL: ${req.url}`)
        );
      }
      // Allow the request to proceed (the route handler should handle it)
      // This prevents blocking legitimate registration/login requests
      return next();
    }

    let token: string | undefined;

    // Priority 1: Check for token in HTTP-only cookie (for browser-based clients)
    // This is the primary method after login, as cookies are automatically sent
    // Note: req.cookies might be undefined if cookie-parser hasn't parsed yet
    // or if no cookies are present, so we check safely
    const cookies = req.cookies || {};
    if (cookies.accessToken && typeof cookies.accessToken === 'string') {
      token = cookies.accessToken;
      if (env.NODE_ENV !== 'production') {
        logger.auth('Token found in cookie', 'Cookie-based authentication');
      }
    }
    // Priority 2: Check Authorization header (for API clients or backward compatibility)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim(); // Extract token (remove "Bearer " prefix)
        if (env.NODE_ENV !== 'production') {
          logger.auth('Token found in Authorization header', 'Header-based authentication');
        }
      }
    }

    // No token found in either location
    if (!token) {
      // Only log errors for protected routes (not public routes)
      if (env.NODE_ENV !== 'production') {
        // Enhanced debugging: log what we checked
        const cookiePresent = !!cookies.accessToken;
        const authHeaderPresent = !!req.headers.authorization;
        logger.authError(
          'Unauthorized access attempt',
          `No token provided (cookie: ${cookiePresent}, header: ${authHeaderPresent})`
        );
      } else {
        logger.authError('Unauthorized access attempt', 'No token provided');
      }
      sendError(res, 'Unauthorized: No token provided', 401);
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request object (Express.Request augmented in src/types/express.d.ts)
    req.user = decoded;

    if (env.NODE_ENV !== 'production') {
      logger.auth('Authentication successful', decoded.email, decoded.userId);
    }

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    const errorType = message.includes('expired') ? 'expired' : 'invalid';
    
    // Enhanced logging for development
    if (env.NODE_ENV !== 'production') {
      logger.authError(`Token verification failed: ${errorType}`, message);
      // Log token source for debugging
      const tokenSource = req.cookies?.accessToken ? 'cookie' : 'header';
      logger.authError('Token source', tokenSource);
    } else {
      logger.authError(`Token verification failed: ${errorType}`, message);
    }
    
    // Return specific error message for frontend to handle
    if (message.includes('expired')) {
      sendError(res, 'Unauthorized: Access token expired', 401);
    } else {
      sendError(res, 'Unauthorized: Invalid access token', 401);
    }
  }
};

/** Alias for authenticate - use for consistency with requireAdmin/requireSuperAdmin */
export const requireAuth = authenticate;

/**
 * Optional authentication - parses JWT if present, does not fail if missing
 * Use for routes where auth is optional (e.g. GET post - public if APPROVED, private if author/admin)
 */
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;
    const cookies = req.cookies || {};
    if (cookies.accessToken && typeof cookies.accessToken === 'string') {
      token = cookies.accessToken;
    }
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }
    if (!token) {
      return next();
    }
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    next();
  }
};

