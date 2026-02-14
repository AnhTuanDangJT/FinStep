import 'dotenv/config';

const raw = process.env;

export interface EnvConfig {
  PORT: number;
  MONGODB_URI: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  FRONTEND_URL: string;
  ALLOWED_ORIGINS?: string;
  NODE_ENV: string;
  RATE_LIMIT_WINDOW_MS?: number;
  RATE_LIMIT_MAX_REQUESTS?: number;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;
  API_PUBLIC_URL?: string;
  PUBLIC_APP_URL?: string;
  API_BASE_URL?: string;
  GITHUB_TOKEN?: string;
  AI_MODEL?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;
}

export const env: EnvConfig = {
  PORT: raw.PORT ? parseInt(raw.PORT, 10) : 4000,
  MONGODB_URI: raw.MONGODB_URI ?? '',
  JWT_ACCESS_SECRET: raw.JWT_ACCESS_SECRET ?? '',
  JWT_REFRESH_SECRET: raw.JWT_REFRESH_SECRET ?? '',
  JWT_ACCESS_EXPIRES_IN: raw.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_IN: raw.JWT_REFRESH_EXPIRES_IN ?? '7d',
  FRONTEND_URL: raw.FRONTEND_URL ?? 'http://localhost:3000',
  ALLOWED_ORIGINS: raw.ALLOWED_ORIGINS,
  NODE_ENV: raw.NODE_ENV ?? 'development',
  RATE_LIMIT_WINDOW_MS: raw.RATE_LIMIT_WINDOW_MS ? parseInt(raw.RATE_LIMIT_WINDOW_MS, 10) : undefined,
  RATE_LIMIT_MAX_REQUESTS: raw.RATE_LIMIT_MAX_REQUESTS ? parseInt(raw.RATE_LIMIT_MAX_REQUESTS, 10) : undefined,
  GOOGLE_CLIENT_ID: raw.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: raw.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: raw.GOOGLE_CALLBACK_URL,
  API_PUBLIC_URL: raw.API_PUBLIC_URL,
  PUBLIC_APP_URL: raw.PUBLIC_APP_URL,
  API_BASE_URL: raw.API_BASE_URL,
  GITHUB_TOKEN: raw.GITHUB_TOKEN,
  AI_MODEL: raw.AI_MODEL,
  CLOUDINARY_CLOUD_NAME: raw.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: raw.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: raw.CLOUDINARY_API_SECRET,
  AWS_ACCESS_KEY_ID: raw.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: raw.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: raw.AWS_REGION,
  AWS_S3_BUCKET: raw.AWS_S3_BUCKET,
};

/**
 * Build absolute public URL for uploads (e.g. cover images).
 * Ensures API always returns absolute URLs so images never "disappear" on different origins.
 */
export function getAbsoluteUploadUrl(relativeOrAbsolute: string | undefined): string | undefined {
  if (relativeOrAbsolute == null || relativeOrAbsolute === '') return undefined;
  const trimmed = relativeOrAbsolute.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const baseUrl = env.API_BASE_URL || env.API_PUBLIC_URL || `http://localhost:${env.PORT}`;
  const base = (typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl : `http://localhost:${env.PORT}`).replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
