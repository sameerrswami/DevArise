import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const res = NextResponse.next();
  
  // Render.com subdomain support
  const allowedHosts = [
    'localhost:3000',
    'devarise.onrender.com',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ];
  
  const origin = req.headers.get('origin') || '';
  const host = req.headers.get('host') || '';
  
  if (!allowedHosts.some(hostPattern => 
    origin.includes(hostPattern) || host.includes(hostPattern.replace('https://', ''))
  )) {
    return new NextResponse('Unauthorized origin', { status: 401 });
  }

  // Security Headers
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  const path = req.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/interviewer') ||
    path.startsWith('/problems') ||
    path.startsWith('/roadmap') ||
    path.startsWith('/resume');

  const isApiRoute =
    path.startsWith('/api/') &&
    !path.startsWith('/api/auth') &&
    !path.startsWith('/api/stripe/webhook');

  if (isProtectedRoute || isApiRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      if (isApiRoute) {
        return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    if (path.startsWith('/recruiter') && token.role !== 'RECRUITER' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
