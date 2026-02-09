/**
 * URL helpers. Base URLs come from env (backend only); never expose tokens.
 */
import { env } from '../config/env';

/** Public app (frontend) base URL for shareable links */
export function getPublicAppUrl(): string {
  return (env.PUBLIC_APP_URL || env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/** API base URL (backend) */
export function getApiBaseUrl(): string {
  return (env.API_BASE_URL || env.API_PUBLIC_URL || `http://localhost:${env.PORT}`).replace(/\/$/, '');
}

/** Build full public URL for a path (e.g. /blogs/my-slug) */
export function buildPublicUrl(path: string): string {
  const base = getPublicAppUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
