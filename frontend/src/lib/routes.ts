/**
 * Central route constants. Use these instead of hardcoded paths.
 */
export const ROUTES = {
  BLOG: "/blog",
  BLOG_WRITE: "/blog/write",
  BLOG_ME: "/blog/me",
  MENTOR: "/mentor",
  PROFILE: "/profile",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  REGISTER: "/register",
  ADMIN: "/admin",
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
