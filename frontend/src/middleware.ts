import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

    // Basic Content Security Policy
    // Note: Adjust 'img-src' / 'script-src' if external services are needed
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https: http://localhost:4000 http://127.0.0.1:4000;
    connect-src 'self' http://localhost:4000 https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
    // Replace newlines with spaces
    const contentSecurityPolicyHeaderValue = cspHeader
        .replace(/\s{2,}/g, ' ')
        .trim()

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })

    response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)
    response.headers.set('X-Frame-Options', 'DENY') // Prevent clickjacking
    response.headers.set('X-Content-Type-Options', 'nosniff') // Prevent MIME sniffing
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
