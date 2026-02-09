import { Router, type RequestHandler } from 'express';
import { register, login, getCurrentUser, updateProfile, logout, googleAuth, googleCallback } from './auth.controller';
import { authenticate } from './auth.middleware';
import { authRateLimiter } from '../../utils/rateLimit';

const router = Router();

// Public routes (with rate limiting - brute force protection)
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

// Google OAuth routes (no rate limiting needed - handled by Google)
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Protected routes (require authentication)
// Cast needed: our handlers use JWT user type; Express types expect Passport User
router.get('/me', authenticate, getCurrentUser as RequestHandler);
router.patch('/profile', authenticate, updateProfile as RequestHandler);
router.post('/logout', authenticate, logout as RequestHandler);

export default router;

