import path from 'path';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import mongoose from 'mongoose';
import fs from 'fs';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import postRoutes from './modules/posts/post.routes';
import adminRoutes from './modules/admin/admin.routes';
import blogRoutes from './modules/blog/blog.routes';
import { uploadBlogCreateImages as blogCreateMulter } from './modules/blog/upload.middleware';
import { uploadAvatarMulter, uploadImageFieldMulter } from './modules/upload/upload.middleware';
import { uploadCoverHandler } from './modules/upload/upload.controller';
import { authenticate } from './modules/auth/auth.middleware';
import chatRoutes from './modules/chat/chat.routes';
import mentorRoutes from './modules/mentor/mentor.routes';
import journeyRoutes from './modules/journey/journey.routes';
import profileRoutes from './modules/profile/profile.routes';
import userRoutes from './modules/profile/user.routes';
import uploadRoutes from './modules/upload/upload.routes';
import aiRoutes from './modules/ai/ai.routes';
import { configureGoogleStrategy } from './modules/auth/auth.passport';
import { sendSuccess, sendError } from './utils/response';
import { logger } from './utils/logger';
import { writeRateLimiter, apiRateLimiter, adminRateLimiter, searchRateLimiter } from './utils/rateLimit';

const app: Application = express();

// Initialize Passport (required for OAuth)
app.use(passport.initialize());

// Configure Google OAuth strategy
configureGoogleStrategy();

// Security middleware – helmet strict config
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production'
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://accounts.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:", (env.API_PUBLIC_URL || `http://localhost:${env.PORT}`).replace(/\/$/, '')],
            connectSrc: ["'self'", "https://accounts.google.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://accounts.google.com"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    xContentTypeOptions: true, // nosniff
    frameguard: { action: 'deny' }, // X-Frame-Options: DENY
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

// CORS configuration
// Supports single origin or multiple origins (comma-separated)
// NEVER allow wildcard origins in production
const getAllowedOrigins = (): string | string[] => {
  if (env.ALLOWED_ORIGINS) {
    // Support multiple origins (comma-separated) for deployment
    const origins = env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
    // Reject wildcard origins for security
    if (origins.some(origin => origin === '*' || origin === 'null')) {
      throw new Error('Wildcard origins are not allowed for security. Use explicit origin URLs.');
    }
    return origins;
  }
  // Fallback to single FRONTEND_URL for backwards compatibility
  const frontendUrl = env.FRONTEND_URL;
  if (frontendUrl === '*' || frontendUrl === 'null') {
    throw new Error('FRONTEND_URL cannot be wildcard. Use explicit origin URL.');
  }
  return frontendUrl;
};

app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Production-safe: explicit origin validation
    optionsSuccessStatus: 200,
  })
);

// Cookie parser middleware (required for cookie-based authentication)
app.use(cookieParser());

// CRITICAL: Run multer for multipart routes BEFORE body parsers so the stream is not consumed.
app.use((req, res, next) => {
  const pathname = (req.originalUrl || req.url || '').split('?')[0].replace(/\/$/, '');
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (req.method !== 'POST' || !contentType.includes('multipart/form-data')) return next();

  const isBlogCreate = pathname === '/blog/create' || pathname.endsWith('/blog/create') || pathname === '/api/blogs/create' || pathname.endsWith('/api/blogs/create');
  if (isBlogCreate) {
    return blogCreateMulter(req, res, (err) => {
      if (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        if (msg.includes('Maximum') || msg.includes('Maximum 4')) return sendError(res, 'Maximum 4 images allowed', 400);
        return sendError(res, msg, 400);
      }
      return next();
    });
  }

  const isAvatarUpload = pathname === '/api/users/avatar' || pathname.endsWith('/api/users/avatar');
  if (isAvatarUpload) {
    return uploadAvatarMulter(req, res, (err) => {
      if (err) {
        const msg = err instanceof Error ? err.message : 'Avatar upload failed';
        if (msg.includes('Maximum') || msg.includes('2MB')) return sendError(res, 'Image must be under 2MB', 400);
        return sendError(res, msg, 400);
      }
      return next();
    });
  }

  const isImageUpload = pathname === '/api/upload' || pathname.endsWith('/api/upload');
  if (isImageUpload) {
    return uploadImageFieldMulter(req, res, (err) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        return sendError(res, message, 400);
      }
      return next();
    });
  }

  return next();
});

// Body parser middleware with size limits (production-safe)
app.use(express.json({ limit: '10mb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for API routes
app.use('/api', apiRateLimiter);

// Static uploads (blog covers, avatars) - create dirs if missing
const uploadsDir = path.join(process.cwd(), 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
// Allow frontend (different origin/port) to embed uploaded images - fixes ERR_BLOCKED_BY_RESPONSE.NotSameOrigin
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint (for deployment monitoring)
// Returns 200 OK if server and database are healthy
app.get('/health', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  
  const isHealthy = dbStatus === 1; // Connected
  
  if (isHealthy) {
    return sendSuccess(
      res,
      'Server is healthy',
      {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      200
    );
  }
  
  // Database not connected - still return 200 for graceful degradation
  // Or return 503 if you want to indicate service degradation
  return sendSuccess(
    res,
    'Server is running but database connection issue detected',
    {
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    200
  );
});

// API routes
// Auth endpoints: /auth/* and /api/auth/* (spec compliant)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Blog routes (matching spec)
app.use('/blog', blogRoutes);
// API alias so POST /api/blogs/:id/images and GET /api/blogs, GET /api/blogs/:id work
app.use('/api/blogs', blogRoutes);

// Chat routes (public, rate limited)
app.use('/chat', chatRoutes);

// Mentor routes (public + auth for profile)
app.use('/mentor', mentorRoutes);
app.use('/api/mentor', mentorRoutes);

// Journey routes (auth for create; optional for get)
app.use('/api/journeys', journeyRoutes);

// Profile routes (auth required for /me)
app.use('/api/profile', profileRoutes);

// Public user profile and stats (no auth)
app.use('/api/users', userRoutes);

// AI gateway (chatbot, writing assistant, summarize, reflection) – token server-side only
app.use('/api/ai', aiRoutes);

// Admin routes (authenticated + admin only) - stricter rate limit
app.use('/admin', adminRateLimiter, adminRoutes);

// POST /upload - cover image upload (auth required, returns { url, coverImageUrl, provider, metadata })
app.use('/upload', (req, res, next) => {
  if (req.method === 'POST') {
    return writeRateLimiter(req, res, next);
  }
  next();
});
app.use('/upload', uploadRoutes);

// POST /api/uploads/cover - spec compliant (multipart field "cover", returns { coverImageUrl })
app.use('/api/uploads', (req, res, next) => {
  if (req.method === 'POST') {
    return writeRateLimiter(req, res, next);
  }
  next();
});
app.use('/api/uploads', uploadRoutes);

// POST /api/upload - blog image upload (multipart field "image", returns { data: { url } })
app.use('/api/upload', (req, res, next) => {
  if (req.method === 'POST') {
    return writeRateLimiter(req, res, next);
  }
  next();
});
app.post('/api/upload', authenticate as express.RequestHandler, uploadCoverHandler as express.RequestHandler);

// Public /posts API – search rate limited to prevent scraping
app.use('/posts', (req, res, next) => {
  if (req.method === 'GET' && req.query?.search) return searchRateLimiter(req, res, next);
  if (req.method === 'POST') return writeRateLimiter(req, res, next);
  next();
});
app.use('/posts', postRoutes);

app.use('/api/posts', (req, res, next) => {
  if (req.method === 'GET' && req.query?.search) return searchRateLimiter(req, res, next);
  if (req.method === 'POST') return writeRateLimiter(req, res, next);
  next();
});
app.use('/api/posts', postRoutes);

// Legacy admin routes (keeping for backward compatibility)
// Only adminRateLimiter (50/15min) – skip writeRateLimiter so admins can grade/approve multiple items
app.use('/api/admin', adminRateLimiter, adminRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  sendError(res, 'Route not found', 404);
});

// Global error handler
// Never leak stack traces or sensitive information in production
app.use((err: Error | undefined, _req: Request, res: Response, _next: express.NextFunction) => {
  const error = err instanceof Error ? err : new Error(err != null ? String(err) : 'Unknown error');
  logger.error('Unhandled error', error);
  const message = env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message;
  sendError(res, message, 500);
});

export default app;

/*
 * BACKEND SANITY CHECKLIST (see BACKEND_SANITY_CHECKLIST.md for full list)
 * - GET /posts: approved only, author+coverImageUrl+counts
 * - POST /posts: PENDING, auth required
 * - POST /upload: {url, provider, metadata}, Cloudinary>S3>local
 * - POST /posts/:id/like, POST /posts/:id/comment: auth required
 * - Admin: GET /admin/posts?status=, POST approve/reject, GET users, POST add-admin
 * - dganhtuan.2k5@gmail.com auto-ADMIN on login
 * - Like unique (postId+userId), no silent failures
 */

