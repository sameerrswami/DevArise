import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  // 1. Performance: Add Security & Caching Headers
  const res = NextResponse.next();
  
  // Security Headers
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // 2. Authentication & Route Protection
  const path = req.nextUrl.pathname;
  
  // List of protected top-level routes
  const isProtectedRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/interviewer') || 
    path.startsWith('/problems') ||
    path.startsWith('/roadmap') ||
    path.startsWith('/resume');

  const isApiRoute = path.startsWith('/api/') && !path.startsWith('/api/auth') && !path.startsWith('/api/stripe/webhook');

  if (isProtectedRoute || isApiRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      if (isApiRoute) {
        return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
      }
      // Redirect to login page for frontend routes
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    
    // 3. Role-Based Access Validation (example for recruiter dashboard)
    if (path.startsWith('/recruiter') && token.role !== 'RECRUITER' && token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

// Ensure middleware only runs on relevant paths to keep performance high
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
