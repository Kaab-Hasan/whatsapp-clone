import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // Check if user is accessing protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/chat');
  const isAuthRoute = request.nextUrl.pathname === '/' || 
                     request.nextUrl.pathname === '/login' || 
                     request.nextUrl.pathname === '/signup';

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If accessing auth routes with valid token, redirect to chat
  if (isAuthRoute && token) {
    const decoded = verifyToken(token);
    if (decoded) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ['/', '/chat/:path*'],
}; 