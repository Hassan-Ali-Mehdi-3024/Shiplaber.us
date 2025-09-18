import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

// Helper function to get role-based route
function getRoleBasedRoute(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'RESELLER':
      return '/reseller';
    case 'USER':
      return '/user';
    default:
      return '/dashboard'; // Fallback to existing dashboard
  }
}

// Helper function to decode session token
async function getSessionFromToken(token: string): Promise<{ role: string } | null> {
  try {
    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    
    // In a real application, you'd want to fetch the user from the database
    // For now, we'll rely on the layouts to handle the full verification
    // This middleware just handles basic route redirection
    
    return null; // Let layouts handle full session verification
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login, api routes, and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value;

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user accesses /dashboard directly, we could redirect them to role-specific route
  // But for now, let's allow /dashboard access and let the layouts handle role-based redirection
  // This preserves backward compatibility
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (root path)
     * - /login (login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|$).*)',
  ],
}