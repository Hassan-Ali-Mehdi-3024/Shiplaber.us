import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { cookies as nextCookies } from 'next/headers';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string; // Changed from enum to string to match SQLite schema
  creditBalance: number;
}

export async function getSession(req: any): Promise<SessionUser | null> {
  try {
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

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      id: string;
    };

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
      role: user.role,
      creditBalance: Number(user.creditBalance)
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function validatePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function createSession(user: SessionUser): string {
  return jwt.sign(
    { id: user.id },
    process.env.NEXTAUTH_SECRET as string,
    { expiresIn: '24h' }
  );
}

export function validateRoleAccess(
  userRole: string,
  allowedRoles: string[]
): boolean {
  return allowedRoles.includes(userRole);
}