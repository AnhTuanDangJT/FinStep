import { API_BASE_URL } from "./config";

/** Base API URL without trailing slash (avoids double-slash 404s when env has trailing slash). */
const getApiBase = (): string => API_BASE_URL;

export interface User {
    id: string;
    name: string;
    email: string;
    role?: string; // 'ADMIN' | 'USER'
    linkedInUrl?: string;
    credibilityScore?: number;
}

export interface AuthResponse {
    user: User;
    token?: string; // Optional if using cookies
}

function isNetworkError(err: unknown): boolean {
    if (err instanceof TypeError && err.message === "Failed to fetch") return true;
    if (err instanceof Error && /failed to fetch|network|connection refused/i.test(err.message)) return true;
    return false;
}

const BACKEND_UNREACHABLE_MSG =
    "Cannot reach the server. Start the backend (in the project root run: npm run dev) and try again.";

class AuthService {
    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        let res: Response;
        try {
            res = await fetch(`${getApiBase()}${endpoint}`, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
                credentials: "include",
            });
        } catch (err) {
            if (isNetworkError(err)) throw new Error(BACKEND_UNREACHABLE_MSG);
            throw err;
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error((errorData as { message?: string }).message || "An error occurred");
        }

        return res.json();
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await this.fetch<{ success: boolean; message: string; data: { user: User; accessToken: string; refreshToken: string } }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        return {
            user: response.data.user,
            token: response.data.accessToken,
        };
    }

    async register(name: string, email: string, password: string): Promise<AuthResponse> {
        const response = await this.fetch<{ success: boolean; message: string; data: { user: User; accessToken: string; refreshToken: string } }>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
        });
        return {
            user: response.data.user,
            token: response.data.accessToken,
        };
    }

    /** Timeout so slow/failed backend does not block UI; safe default on error. */
    private static GET_ME_TIMEOUT_MS = 8000;

    /**
     * Get current user. Uses cookie (credentials: "include") and optionally Bearer token
     * so deployment (cross-origin) works when cookie is not sent.
     */
    async getMe(accessToken?: string | null): Promise<{ user: User | null; token?: string }> {
        try {
            const ctrl = new AbortController();
            const timeoutId = setTimeout(() => ctrl.abort(), AuthService.GET_ME_TIMEOUT_MS);
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (accessToken && typeof accessToken === "string") {
                headers["Authorization"] = `Bearer ${accessToken}`;
            }
            const res = await fetch(`${getApiBase()}/auth/me`, {
                method: "GET",
                headers,
                credentials: "include",
                signal: ctrl.signal,
            });
            clearTimeout(timeoutId);
            if (!res.ok) return { user: null };
            const data = await res.json();
            const payload = data?.data ?? {};
            const user = payload.user ?? null;
            const token = typeof payload.accessToken === "string" ? payload.accessToken : undefined;
            return { user, token };
        } catch {
            return { user: null };
        }
    }

    async logout(): Promise<void> {
        try {
            await this.fetch("/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout failed", error);
        }
    }

    async updateProfile(data: { name?: string; linkedInUrl?: string }): Promise<{ user: User }> {
        const response = await this.fetch<{ success: boolean; message: string; data: { user: User } }>("/auth/profile", {
            method: "PATCH",
            body: JSON.stringify(data),
        });
        return { user: (response as { data: { user: User } }).data.user };
    }
}

export const authService = new AuthService();
