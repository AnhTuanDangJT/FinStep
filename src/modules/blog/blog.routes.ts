import { Router, type RequestHandler } from 'express';
import { authenticate, optionalAuthenticate } from '../auth/auth.middleware';
import { requireAdmin } from '../admin/admin.middleware';
import { stripForbiddenFields } from '../../utils/security';
import { writeRateLimiter } from '../../utils/rateLimit';
import {
  createBlogHandler,
  getPublicBlogsHandler,
  getMyBlogsHandler,
  getBlogByIdHandler,
  getBlogBySlugHandler,
  getShareUrlHandler,
  getPendingBlogsHandler,
  submitBlogHandler,
  approveBlogHandler,
  rejectBlogHandler,
  toggleLikeHandler,
  updateBlogHandler,
  deleteBlogHandler,
  uploadBlogImagesHandler,
} from './blog.controller';
import { getCommentsHandler, addCommentHandler } from '../posts/post.controller';
import { uploadBlogImages } from './upload.middleware';
import { sendError } from '../../utils/response';

const router = Router();

// Public route - get approved blogs only
router.get('/public', getPublicBlogsHandler);

// Authenticated routes - create accepts JSON or multipart/form-data with optional coverImage
// Multer for multipart runs in app.ts BEFORE body parsers so the upload stream is not consumed
router.post(
  '/create',
  authenticate,
  writeRateLimiter,
  stripForbiddenFields,
  createBlogHandler as RequestHandler
);
router.get('/me', authenticate, getMyBlogsHandler as RequestHandler);
router.get('/slug/:slug', getBlogBySlugHandler); // Public shareable link by slug
router.get('/:id/comments', getCommentsHandler as RequestHandler);
router.post('/:id/comment', optionalAuthenticate as RequestHandler, addCommentHandler as RequestHandler);
// POST /blog/:id/images — multiple files, field "images"; must be before GET /:id
router.post(
  '/:id/images',
  authenticate,
  writeRateLimiter,
  stripForbiddenFields,
  (req, res, next): void => {
    uploadBlogImages(req, res, (err) => {
      if (err) {
        sendError(res, err instanceof Error ? err.message : 'Upload failed', 400);
        return;
      }
      next();
    });
  },
  uploadBlogImagesHandler as RequestHandler
);
router.get('/:id', optionalAuthenticate as RequestHandler, getBlogByIdHandler as RequestHandler); // Guest read for APPROVED
router.post('/:id/share', optionalAuthenticate as RequestHandler, getShareUrlHandler as RequestHandler);
router.put('/:id', authenticate, stripForbiddenFields, updateBlogHandler as RequestHandler);
router.post('/:id/submit', authenticate, submitBlogHandler as RequestHandler);
router.delete('/:id', authenticate, deleteBlogHandler as RequestHandler);
router.post('/:id/like', authenticate, toggleLikeHandler as RequestHandler);

// Admin routes
router.get('/admin/pending', authenticate, requireAdmin as RequestHandler, getPendingBlogsHandler as RequestHandler);
router.post('/admin/approve/:id', authenticate, requireAdmin as RequestHandler, writeRateLimiter, approveBlogHandler as RequestHandler);
router.post('/admin/reject/:id', authenticate, requireAdmin as RequestHandler, writeRateLimiter, rejectBlogHandler as RequestHandler);

export default router;



