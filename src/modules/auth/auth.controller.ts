import { Request, Response } from 'express';
import passport from 'passport';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.schema';
import { registerUser, loginUser, getUserById, updateUserProfile } from './auth.service';
import { generateAuthResponseForGoogleUser } from './auth.oauth';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { parseExpirationToMs, generateAccessToken } from '../../utils/jwt';
import { env } from '../../config/env';
import { isGoogleOAuthConfigured } from './auth.passport';

/**
 * Register endpoint handler
 * POST /auth/register
 * Body: { email: string, password: string }
 */
export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate request body
    const validationResult = registerSchema.safeParse(req);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    const input = validationResult.data.body;

    // Register user
    const result = await registerUser(input);

    // Set access token as HTTP-only cookie for automatic authentication
    // Cookie expires at the same time as the JWT token
    const cookieMaxAge = parseExpirationToMs(env.JWT_ACCESS_EXPIRES_IN);
    const isProduction = env.NODE_ENV === 'production';
    
    // Cookie settings for cross-origin support
    // Dev: sameSite 'lax' (same host, different port). Production: 'none' so cookie is sent when frontend (e.g. fin-step-frontend.vercel.app) calls API (fin-step.vercel.app); requires secure: true.
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    };
    
    res.cookie('accessToken', result.accessToken, cookieOptions);

    // Return user and tokens (still returning tokens in body for backward compatibility)
    // Frontend should store tokens (accessToken in memory/localStorage, refreshToken in httpOnly cookie)
    return sendSuccess(
      res,
      'Account created successfully',
      result,
      201
    );
  } catch (error) {
    // MongoDB duplicate key (E11000) - race condition or index collision
    const mongoError = error as { code?: number };
    if (mongoError?.code === 11000) {
      return sendError(res, 'Registration failed. Please try again or use a different email.', 409);
    }

    // Prevent email enumeration - use generic error messages
    const message = error instanceof Error ? error.message : 'Registration failed';
    // OAuth-specific: user should sign in with Google
    if (message.includes('via Google') || message.includes('Google OAuth')) {
      return sendError(res, 'Email already registered via Google. Please sign in with Google.', 409);
    }
    // Generic duplicate email
    if (message.includes('already registered')) {
      return sendError(res, 'Registration failed. Please try again or use a different email.', 409);
    }
    return sendError(res, 'Registration failed. Please check your input and try again.', 400);
  }
};

/**
 * Login endpoint handler
 * POST /auth/login
 * Body: { email: string, password: string }
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    const input = validationResult.data.body;

    // Login user
    const result = await loginUser(input);

    // Set access token as HTTP-only cookie for automatic authentication
    // Cookie expires at the same time as the JWT token
    const cookieMaxAge = parseExpirationToMs(env.JWT_ACCESS_EXPIRES_IN);
    const isProduction = env.NODE_ENV === 'production';
    
    // Cookie settings for cross-origin support
    // Dev: sameSite 'lax' (same host, different port). Production: 'none' so cookie is sent when frontend (e.g. fin-step-frontend.vercel.app) calls API (fin-step.vercel.app); requires secure: true.
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    };
    
    res.cookie('accessToken', result.accessToken, cookieOptions);

    // Return user and tokens (still returning tokens in body for backward compatibility)
    // Frontend should store tokens (accessToken in memory/localStorage, refreshToken in httpOnly cookie)
    return sendSuccess(res, 'Login successful', result, 200);
  } catch (error) {
    // Prevent email enumeration - always use generic error message
    // Never reveal whether email exists or password is wrong
    const genericMessage = 'Invalid email or password';
    return sendError(res, genericMessage, 401);
  }
};

/**
 * Get current user endpoint handler
 * GET /auth/me
 * Requires: Authorization: Bearer <access_token>
 */
export const getCurrentUser = async (
  req: Request & { user?: { userId: string; email: string } },
  res: Response
): Promise<Response> => {
  try {
    // User is attached to request by auth middleware
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Fetch full user data from database
    const user = await getUserById(req.user.userId);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if user is admin (email === "dganhtuan.2k5@gmail.com" OR has ADMIN role)
    const isAdmin = user.email === 'dganhtuan.2k5@gmail.com' || 
                    (user.roles && user.roles.includes('ADMIN'));

    // Prevent caching so auth state is never stale; avoids re-render storms from cached responses
    res.setHeader('Cache-Control', 'private, no-store, no-cache');

    // Return accessToken so frontend can set Authorization header (cookie may not be sent on cross-origin fetch)
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Return minimal user payload (only fields used by frontend)
    return sendSuccess(
      res,
      'User retrieved successfully',
      {
        user: {
          id: (user as { publicId?: string }).publicId || user._id.toString(),
          publicId: (user as { publicId?: string }).publicId || user._id.toString(),
          email: user.email,
          name: user.name,
          linkedInUrl: user.linkedInUrl || '',
          role: isAdmin ? 'ADMIN' : 'USER',
          isAdmin,
        },
        accessToken,
      },
      200
    );
  } catch (error) {
    logger.error('Failed to get user', error instanceof Error ? error : undefined);
    const message = error instanceof Error ? error.message : 'Failed to get user';
    return sendError(res, message, 500);
  }
};

/**
 * Update profile endpoint handler
 * PATCH /auth/profile
 * Body: { name?: string, linkedInUrl?: string }
 */
export const updateProfile = async (
  req: Request & { user?: { userId: string; email: string } },
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const validationResult = updateProfileSchema.safeParse(req);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    const user = await updateUserProfile(req.user.userId, validationResult.data.body);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const isAdmin = user.email === 'dganhtuan.2k5@gmail.com' || (user.roles && user.roles.includes('ADMIN'));

    return sendSuccess(
      res,
      'Profile updated successfully',
      {
        user: {
          id: (user as { publicId?: string }).publicId || user._id.toString(),
          publicId: (user as { publicId?: string }).publicId || user._id.toString(),
          email: user.email,
          name: user.name,
          linkedInUrl: user.linkedInUrl || '',
          role: isAdmin ? 'ADMIN' : 'USER',
        },
      },
      200
    );
  } catch (error) {
    logger.error('Failed to update profile', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to update profile', 500);
  }
};

/**
 * Logout endpoint handler
 * POST /auth/logout
 * 
 * Clears the access token cookie and logs the logout event
 */
export const logout = async (
  req: Request & { user?: { userId: string; email: string } },
  res: Response
): Promise<Response> => {
  // Log logout event if user is authenticated
  if (req.user) {
    logger.auth('Logout', req.user.email, req.user.userId);
  }
  
  // Clear the access token cookie (sameSite must match the cookie we set)
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  
  // Frontend should also remove tokens from storage (if stored client-side)
  // If implementing token blacklisting, add logic here
  
  return sendSuccess(res, 'Logout successful', undefined, 200);
};

/**
 * Google OAuth initiation handler
 * GET /auth/google
 * 
 * Redirects user to Google OAuth consent screen
 */
export const googleAuth = (req: Request, res: Response, next: (err?: any) => void): void => {
  // Check if Google OAuth is configured
  if (!isGoogleOAuthConfigured()) {
    logger.authError('Google OAuth not configured', 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_not_configured`);
  }
  
  // Use passport authenticate middleware
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
};

/**
 * Google OAuth callback handler
 * GET /auth/google/callback
 * 
 * Handles Google OAuth response, creates/updates user, and redirects to frontend
 */
export const googleCallback = async (
  req: Request,
  res: Response,
  next: (err?: any) => void
): Promise<void> => {
  passport.authenticate('google', { session: false }, async (err: Error | null, user: any) => {
    try {
      if (err || !user) {
        logger.authError('Google OAuth failed', err?.message || 'Authentication failed');
        // Redirect to frontend login page with error
        return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Generate JWT tokens (same format as email login)
      const authResult = await generateAuthResponseForGoogleUser(user);

      // Set access token as HTTP-only cookie
      const cookieMaxAge = parseExpirationToMs(env.JWT_ACCESS_EXPIRES_IN);
      const isProduction = env.NODE_ENV === 'production';
      
      res.cookie('accessToken', authResult.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: cookieMaxAge,
        path: '/',
      });

      logger.auth('Google OAuth successful', user.email, user._id.toString());

      // Redirect to frontend dashboard
      // Frontend should call /auth/me to get user data
      res.redirect(`${env.FRONTEND_URL}/dashboard`);
    } catch (error) {
      logger.error('Google OAuth callback error', error instanceof Error ? error : undefined);
      res.redirect(`${env.FRONTEND_URL}/login?error=oauth_error`);
    }
  })(req, res, next);
};

