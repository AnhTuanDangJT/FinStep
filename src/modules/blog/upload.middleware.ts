import multer from 'multer';
import { Request } from 'express';
import { ALLOWED_MIMES as UPLOAD_ALLOWED_MIMES, MAX_FILE_SIZE as UPLOAD_MAX_SIZE } from '../upload/upload.service';

// Max number of images per blog (enforced: 4)
export const MAX_BLOG_IMAGES = 4;

// Vercel serverless body limit is 4.5MB; keep under to avoid 500/413
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const storage = multer.memoryStorage();

// Validate MIME type and file size so only allowed images are stored
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    return;
  }
  cb(null, true);
}

const blogImagesFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (!UPLOAD_ALLOWED_MIMES.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    return;
  }
  cb(null, true);
};

/** Single cover image – memory storage; upload to Cloudinary in controller */
export const uploadCoverImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('coverImage');

/**
 * Multer for POST /blog/create – accepts "coverImage" (single) and/or "images" (max 4).
 * Memory storage; upload to Cloudinary in controller.
 */
export const uploadBlogCreateWithCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: MAX_BLOG_IMAGES },
]);

/** Multer for POST /blog/create – multipart field "images" (max 4) – memory storage */
export const uploadBlogCreateImages = multer({
  storage,
  fileFilter: blogImagesFileFilter,
  limits: { fileSize: UPLOAD_MAX_SIZE, files: MAX_BLOG_IMAGES },
}).array('images', MAX_BLOG_IMAGES);

/** Multer for POST /blog/:id/images - multiple files, field name "images" */
export const uploadBlogImages = multer({
  storage,
  fileFilter: blogImagesFileFilter,
  limits: { fileSize: UPLOAD_MAX_SIZE, files: MAX_BLOG_IMAGES },
}).array('images', MAX_BLOG_IMAGES);

export { ALLOWED_MIMES, MAX_FILE_SIZE };
