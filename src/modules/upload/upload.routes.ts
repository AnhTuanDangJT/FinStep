import { Router, type RequestHandler } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { writeRateLimiter } from '../../utils/rateLimit';
import { uploadCoverImageMulter, uploadCoverFieldMulter } from './upload.middleware';
import { uploadCoverHandler } from './upload.controller';
import { sendError } from '../../utils/response';

const router = Router();

// POST /upload - auth required, returns { url, coverImageUrl, provider, metadata }
router.post(
  '/',
  authenticate,
  writeRateLimiter,
  (req, res, next) => {
    uploadCoverImageMulter(req, res, (err) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        return sendError(res, message, 400);
      }
      return next();
    });
  },
  uploadCoverHandler as RequestHandler
);

// POST /upload/cover - spec compliant: field "cover", returns { coverImageUrl }
router.post(
  '/cover',
  authenticate,
  writeRateLimiter,
  (req, res, next) => {
    uploadCoverFieldMulter(req, res, (err) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        return sendError(res, message, 400);
      }
      return next();
    });
  },
  uploadCoverHandler as RequestHandler
);

export default router;
