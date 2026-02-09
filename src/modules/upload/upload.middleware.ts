import multer from 'multer';
import { Request } from 'express';
import { ALLOWED_MIMES, MAX_FILE_SIZE } from './upload.service';

/**
 * Memory storage for cloud uploads - no temp files on disk
 */
const memoryStorage = multer.memoryStorage();

/** Avatar: jpg, png, webp only; 2MB max */
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

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

function avatarFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (!AVATAR_MIMES.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed for avatar.'));
    return;
  }
  cb(null, true);
}

const multerOpts = {
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
};

export const uploadCoverImageMulter = multer(multerOpts).single('coverImage');

/** For POST /api/uploads/cover - accepts "cover" field (spec compliant) */
export const uploadCoverFieldMulter = multer(multerOpts).single('cover');

/** For POST /api/upload - frontend blog image upload (field "image") */
export const uploadImageFieldMulter = multer(multerOpts).single('image');

/** POST /api/users/avatar - field "avatar", image only (jpg/png/webp), 2MB, memory buffer for sharp processing */
export const uploadAvatarMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: avatarFileFilter,
  limits: { fileSize: AVATAR_MAX_SIZE },
}).single('avatar');
