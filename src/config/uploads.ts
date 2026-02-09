import path from 'path';
import fs from 'fs';

/** On Vercel/serverless, use /tmp (writable); otherwise use cwd/uploads */
export const UPLOADS_ROOT =
  process.env.VERCEL === '1' ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');

export const AVATARS_DIR = path.join(UPLOADS_ROOT, 'avatars');

/** Create uploads dirs if missing. Never throws (safe for serverless). */
export function ensureUploadsDirs(): void {
  try {
    if (!fs.existsSync(UPLOADS_ROOT)) {
      fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
    }
    if (!fs.existsSync(AVATARS_DIR)) {
      fs.mkdirSync(AVATARS_DIR, { recursive: true });
    }
  } catch {
    // Ignore: read-only filesystem (e.g. some serverless environments)
  }
}
