import jwt, { TokenExpiredError, JsonWebTokenError, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  name?: string; // Optional for backward compatibility
}

/**
 * Generate access token (short-lived, 15 minutes)
 * Frontend will send this in Authorization header for protected routes
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
  } as SignOptions);
};

/**
 * Generate refresh token (long-lived, 7 days)
 * Frontend will send this to get new access tokens
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
  } as SignOptions);
};

/**
 * Verify access token
 * Used in auth middleware to protect routes
 * @throws Error with specific message for expired vs invalid tokens
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Verify refresh token
 * Used when frontend requests a new access token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Parse JWT expiration string to milliseconds
 * Used for setting cookie expiration times
 * Supports: '15m', '1h', '7d', etc.
 */
export const parseExpirationToMs = (expiration: string): number => {
  const unit = expiration.slice(-1);
  const value = parseInt(expiration.slice(0, -1), 10);
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      // Default to 15 minutes if format is unrecognized
      return 15 * 60 * 1000;
  }
};

