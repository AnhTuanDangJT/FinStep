/**
 * Augments Express Request with our JWT-based auth user type.
 * We use JWT decode payload from auth middleware (not Passport's User).
 * Inlined type to avoid circular deps; must match utils/jwt TokenPayload.
 */
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string; name?: string };
    }
  }
}

export {};
