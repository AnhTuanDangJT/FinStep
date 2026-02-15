import multer from 'multer';
import { Request } from 'express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../../config/cloudinary';
import { ALLOWED_MIMES as UPLOAD_ALLOWED_MIMES, MAX_FILE_SIZE as UPLOAD_MAX_SIZE } from '../upload/upload.service';

// Max number of images per blog (enforced: 4)
export const MAX_BLOG_IMAGES = 4;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'finstep-blogs',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  } as Record<string, unknown>,
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

/** Single cover image – uploads to Cloudinary, req.file.path is the image URL */
export const uploadCoverImage = multer({
  storage: cloudinaryStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('coverImage');

/** Memory storage for multi-file blog images (used with upload.service for POST /blog/:id/images) */
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
 * Uses Cloudinary storage; req.files.coverImage[0].path and req.files.images[].path are Cloudinary URLs.
 */
export const uploadBlogCreateWithCover = multer({
  storage: cloudinaryStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: MAX_BLOG_IMAGES },
]);

/**
 * Multer for POST /blog/create – multipart field "images" (max 4) – memory storage (legacy path).
 * Use uploadBlogCreateWithCover for Cloudinary and correct public URLs.
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

export { ALLOWED_MIMES, MAX_FILE_SIZE };
