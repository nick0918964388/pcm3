import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Define protected and public routes more explicitly
  const publicPaths = ['/login', '/api/auth'];
  const staticPaths = ['/_next', '/favicon.ico'];
  
  const isPublicRoute = publicPaths.some(path => nextUrl.pathname.startsWith(path));
  const isStaticRoute = staticPaths.some(path => nextUrl.pathname.startsWith(path));
  
  // Skip processing for static files
  if (isStaticRoute) {
    return NextResponse.next();
  }

  const isProtectedRoute = !isPublicRoute && nextUrl.pathname !== '/';

  // Redirect logic with more explicit conditions
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('from', nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && nextUrl.pathname === '/login') {
    const redirectTo = nextUrl.searchParams.get('from') || '/projects';
    return Response.redirect(new URL(redirectTo, nextUrl.origin));
  }

  // Create response with security headers
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy - Balanced security for Next.js compatibility
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js dev/build
    "style-src 'self' 'unsafe-inline'", // Required for Tailwind CSS
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Rate limiting headers (placeholder for future implementation)
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', '99')

  return response
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/auth/:path*'
  ]
}