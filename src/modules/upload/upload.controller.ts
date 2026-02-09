import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { uploadCoverImage } from './upload.service';

interface MulterRequest extends Request {
  file?: Express.Multer.File & { buffer?: Buffer };
}

/**
 * POST /upload - Upload cover image (auth required)
 * Returns { url, coverImageUrl, provider, metadata }; coverImageUrl is always absolute so images never disappear.
 */
export const uploadCoverHandler = async (
  req: MulterRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.file) {
      return sendError(res, 'No file provided. Send multipart/form-data with field "coverImage" or "cover".', 400);
    }

    // Ensure buffer is available (memory storage) — never use temp file paths in DB
    const file = req.file as Express.Multer.File & { buffer?: Buffer };
    if (!file.buffer) {
      logger.error('Upload failed: multer did not provide buffer (check storage config)', undefined);
      return sendError(res, 'File upload failed: no buffer', 500);
    }

    logger.info('Image upload started', { originalname: file.originalname, mimetype: file.mimetype, size: file.size });
    const result = await uploadCoverImage(file);

    // Ensure coverImageUrl is always returned (spec compliance); url and coverImageUrl are the same absolute URL
    const responseData = {
      ...result,
      coverImageUrl: result.url,
    };

    logger.info('Image upload success', { provider: result.provider, url: result.url });
    return sendSuccess(res, 'Image uploaded successfully', responseData, 200);
  } catch (error) {
    const err = error instanceof Error ? error : undefined;
    const message = err?.message ?? 'Upload failed';
    // Explicit error logging so upload failures are never silent
    logger.error('Upload failed', err);
    // Return 500 for server/provider errors (Cloudinary, S3, disk); 400 for validation
    const isClientError = /invalid file|file too large|no file|validation/i.test(message);
    const statusCode = isClientError ? 400 : 500;
    return sendError(res, message, statusCode);
  }
};
