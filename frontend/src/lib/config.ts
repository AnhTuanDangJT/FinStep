/**
 * Centralized API Configuration
 * 
 * This file handles the logic for determining the API base URL.
 * It prioritizes the environment variable NEXT_PUBLIC_API_URL,
 * but falls back to a hardcoded Vercel URL if not set.
 * 
 * IMPORTANT: Replace 'YOUR_BACKEND_PROJECT.vercel.app' with your actual backend Vercel URL.
 */

// Fallback URL - CHANGE THIS to your actual backend URL if env var is missing
const DEFAULT_VERCEL_URL = "https://finstep-backend.vercel.app";

export const getApiBaseUrl = (): string => {
    // 1. Get URL from environment or fallback
    let url = process.env.NEXT_PUBLIC_API_URL || DEFAULT_VERCEL_URL;

    // 2. Ensure no trailing slash
    url = url.replace(/\/$/, "");

    // 3. Force HTTPS (unless strictly localhost for dev, but user requested "All requests use HTTPS")
    // If you explicitly want http on localhost, you can modify this logic. 
    // For now, consistent with "All requests use HTTPS":
    if (!url.startsWith("http")) {
        url = `https://${url}`;
    } else if (url.startsWith("http://") && !url.includes("localhost")) {
        // Upgrade http to https for non-localhost
        url = url.replace("http://", "https://");
    }

    return url;
};

// Export a constant for easy usage, though function is safer for runtime env var changes if any (Next.js env vars are build-time usually)
export const API_BASE_URL = getApiBaseUrl();
