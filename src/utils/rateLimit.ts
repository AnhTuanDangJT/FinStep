import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Rate limiter for write operations (create post, approve post)
 * Default: 5 requests per 15 minutes per IP
 */
export const writeRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS || 5, // 5 requests per window
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'test',
});

/**
 * Rate limiter for general API requests (less restrictive)
 * Default: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'test',
});

/**
 * Rate limiter for login/register – brute force protection
 * Stricter: 10 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'test',
});

/**
 * Rate limiter for search endpoints – prevent scraping
 * 30 requests per 15 minutes per IP
 */
export const searchRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many search requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'test',
});

/**
 * Rate limiter for admin endpoints – stricter
 * 50 requests per 15 minutes per IP
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'test',
});

/**
 * Rate limiter for blog creation – prevent spam
 * 5 requests per 15 minutes per IP
 */
export const blogCreateRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many blog creation attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'test',
});

/**
 * Rate limiter for AI gateway
 * Default: 30 requests per 15 minutes per IP
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'test',
});





