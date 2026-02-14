import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import { UPLOADS_ROOT, ensureUploadsDirs } from '../../config/uploads';
import { ALLOWED_MIMES as UPLOAD_ALLOWED_MIMES, MAX_FILE_SIZE as UPLOAD_MAX_SIZE } from '../upload/upload.service';

// Max number of images per blog (enforced: 4)
export const MAX_BLOG_IMAGES = 4;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

ensureUploadsDirs();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDirs();
    cb(null, UPLOADS_ROOT);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ALLOWED_MIMES.some((m) => file.mimetype === m) ? ext : '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    cb(null, name);
  },
});

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

/** Single cover image (legacy) – prefer uploadBlogCreateImages for new clients */
export const uploadCoverImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('coverImage');

/** Memory storage for multi-file blog images (used with upload.service) */
const memoryStorage = multer.memoryStorage();
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

/**
 * Multer for POST /blog/create – accepts "coverImage" (single) and/or "images" (max 4).
 * Uses disk storage so files are in uploads/ and controller can build full URL from req.file.filename.
 */
export const uploadBlogCreateWithCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: MAX_BLOG_IMAGES },
]);

/**
 * Multer for POST /blog/create – multipart field "images" (max 4) – memory storage (legacy path).
 * Use uploadBlogCreateWithCover for disk storage and correct public URLs.
 */
export const uploadBlogCreateImages = multer({
  storage: memoryStorage,
  fileFilter: blogImagesFileFilter,
  limits: { fileSize: UPLOAD_MAX_SIZE, files: MAX_BLOG_IMAGES },
}).array('images', MAX_BLOG_IMAGES);

/** Multer for POST /blog/:id/images - multiple files, field name "images" */
export const uploadBlogImages = multer({
  storage: memoryStorage,
  fileFilter: blogImagesFileFilter,
  limits: { fileSize: UPLOAD_MAX_SIZE, files: MAX_BLOG_IMAGES },
}).array('images', MAX_BLOG_IMAGES);

export { UPLOADS_ROOT as UPLOAD_DIR, ALLOWED_MIMES, MAX_FILE_SIZE };
