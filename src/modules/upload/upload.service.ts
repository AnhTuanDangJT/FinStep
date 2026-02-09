import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env, getAbsoluteUploadUrl } from '../../config/env';
import { logger } from '../../utils/logger';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/** Magic bytes for image validation (first bytes of file) */
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37], [0x47, 0x49, 0x46, 0x38, 0x39]], // GIF87a, GIF89a
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP is RIFF....WEBP)
};

function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = IMAGE_SIGNATURES[mimetype];
  if (!signatures || buffer.length < 12) return false;
  for (const sig of signatures) {
    if (buffer.length >= sig.length) {
      const match = sig.every((byte, i) => buffer[i] === byte);
      if (match) {
        if (mimetype === 'image/webp') {
          return buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50; // WEBP
        }
        return true;
      }
    }
  }
  return false;
}

/** Virus/malware scanning hook placeholder – integrate ClamAV or cloud scanner when available */
export async function virusScanPlaceholder(_buffer: Buffer, _filename: string): Promise<{ clean: boolean }> {
  // TODO: Integrate ClamAV or cloud malware scanner (e.g. VirusTotal API)
  return { clean: true };
}

export interface UploadResult {
  url: string;
  provider: 'cloudinary' | 's3' | 'local';
  metadata?: Record<string, unknown>;
}

function isCloudinaryConfigured(): boolean {
  return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function isS3Configured(): boolean {
  return !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET);
}

/**
 * Validate file before upload – MIME type, size, magic bytes
 */
export function validateUploadFile(file: Express.Multer.File & { buffer?: Buffer }): {
  valid: boolean;
  error?: string;
} {
  if (!file || !file.buffer) {
    return { valid: false, error: 'No file provided' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  const mimetype = (file.mimetype || '').toLowerCase();
  if (!ALLOWED_MIMES.includes(mimetype)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
    };
  }
  const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);
  if (!validateMagicBytes(buffer, mimetype)) {
    return {
      valid: false,
      error: 'Invalid file: content does not match declared type.',
    };
  }
  return { valid: true };
}

/**
 * Upload to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  _originalName: string
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'finstep/blog-covers',
        resource_type: 'image',
        format: mimetype.split('/')[1] || 'jpg',
      },
      (err, result) => {
        if (err) {
          logger.error('Cloudinary upload failed', err);
          reject(new Error('Cloudinary upload failed: ' + (err.message || 'Unknown error')));
          return;
        }
        if (!result || !result.secure_url) {
          reject(new Error('Cloudinary upload failed: No URL returned'));
          return;
        }
        resolve({
          url: result.secure_url,
          provider: 'cloudinary',
          metadata: {
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          },
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Upload to S3
 */
async function uploadToS3(
  buffer: Buffer,
  mimetype: string,
  originalName: string
): Promise<UploadResult> {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured');
  }

  const client = new S3Client({
    region: env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const ext = originalName.split('.').pop() || mimetype.split('/')[1] || 'jpg';
  const key = `blog-covers/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      CacheControl: 'max-age=31536000',
    })
  );

  // Build public URL - S3 bucket must be configured for public read or use CloudFront
  const region = env.AWS_REGION || 'us-east-1';
  const url = `https://${env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

  return {
    url,
    provider: 's3',
    metadata: { key, bucket: env.AWS_S3_BUCKET },
  };
}

/**
 * Local disk fallback (when no cloud provider configured)
 * Images persist in uploads/ - use API_PUBLIC_URL for absolute URLs
 */
async function uploadToLocal(
  buffer: Buffer,
  mimetype: string,
  _originalName: string
): Promise<UploadResult> {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    const safeExt = '.' + (mimetype.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 15)}${safeExt}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    const relativePath = `/uploads/${filename}`;
    // Always return absolute URL so images never disappear on different origins
    const url = getAbsoluteUploadUrl(relativePath) || relativePath;
    logger.info('Local upload saved', { filename, path: relativePath, absoluteUrl: url });
    return {
      url,
      provider: 'local',
      metadata: { filename, path: relativePath },
    };
  } catch (err) {
    logger.error('Local upload failed (disk write)', err instanceof Error ? err : undefined);
    throw new Error('Local upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
  }
}

/**
 * Upload cover image - Cloudinary (if env present) > S3 > local disk
 * Returns absolute public URL only; never file system paths.
 */
export async function uploadCoverImage(
  file: Express.Multer.File
): Promise<UploadResult> {
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = file.buffer as Buffer;
  const virusResult = await virusScanPlaceholder(buffer, file.originalname || '');
  if (!virusResult.clean) {
    throw new Error('File failed security scan.');
  }

  const mimetype = file.mimetype || 'image/jpeg';
  const originalName = file.originalname || 'cover.jpg';

  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, mimetype, originalName);
  }
  if (isS3Configured()) {
    return uploadToS3(buffer, mimetype, originalName);
  }
  return uploadToLocal(buffer, mimetype, originalName);
}

export { MAX_FILE_SIZE, ALLOWED_MIMES };
