import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { cookies as nextCookies } from 'next/headers';
import { UserRole, type SessionUser } from '@/types/index';

export { type SessionUser } from '@/types/index';

export async function getSession(req: any): Promise<SessionUser | null> {
  try {
    // Validate JWT secret is available
    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.error('NEXTAUTH_SECRET environment variable is not set');
      return null;
    }

    // Get the token from cookies
    let token: string | undefined;
    
    // If we have a request object from middleware
    if (req && req.cookies && typeof req.cookies.get === 'function') {
      token = req.cookies.get('auth-token')?.value;
    } 
    // If we're in an App Router server component with ReadonlyRequestCookies
    else if (req && req.cookies && typeof req.cookies === 'function') {
      const cookieStore = req.cookies();
      token = cookieStore.get('auth-token')?.value;
    }
    // Directly use next/headers cookies in App Router
    else {
      const cookieStore = nextCookies();
      token = cookieStore.get('auth-token')?.value;
    }
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
    };

    // Validate decoded token structure
    if (!decoded.id || typeof decoded.id !== 'string') {
      console.error('Invalid token structure');
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        creditBalance: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      creditBalance: Number(user.creditBalance)
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function validatePassword(password: string, hash: string): Promise<boolean> {
  // Input validation
  if (!password || !hash) {
    return false;
  }
  
  if (typeof password !== 'string' || typeof hash !== 'string') {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password validation error:', error);
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  // Password validation
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  // Check for complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    throw new Error('Password must contain uppercase, lowercase, number, and special character');
  }

  try {
    return await bcrypt.hash(password, 12); // Increased from 10 to 12 for better security
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

export function createSession(user: SessionUser): string {
  const jwtSecret = process.env.NEXTAUTH_SECRET;
  if (!jwtSecret) {
    throw new Error('NEXTAUTH_SECRET environment variable is not set');
  }

  // Validate user object
  if (!user.id || !user.email || !user.role) {
    throw new Error('Invalid user object for session creation');
  }

  return jwt.sign(
    { id: user.id },
    jwtSecret,
    { expiresIn: '24h' }
  );
}

export function validateRoleAccess(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  // Input validation
  if (!userRole || !Array.isArray(allowedRoles)) {
    return false;
  }

  return allowedRoles.includes(userRole);
}

// Email validation function
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

// Get role-specific route for redirects
export function getRoleBasedRoute(role: UserRole): string {
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