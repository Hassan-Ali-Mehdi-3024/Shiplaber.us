import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create standardized API response
export function createApiResponse<T>(
  data?: T,
  message?: string,
  success: boolean = true
): ApiResponse<T> {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
  };
}

// Create error response
export function createErrorResponse(
  error: string,
  statusCode: number = 400
): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status: statusCode }
  );
}

// Rate limiting middleware
export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return function rateLimitMiddleware(req: NextRequest): NextResponse | null {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const key = `rate_limit:${ip}`;

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null; // Continue
    }

    if (record.count >= maxRequests) {
      return createErrorResponse('Too many requests', 429);
    }

    record.count++;
    return null; // Continue
  };
}

// Authentication middleware
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: any; error?: NextResponse }> {
  try {
    const user = await getSession(req);

    if (!user) {
      return {
        user: null,
        error: createErrorResponse('Unauthorized - Please log in', 401),
      };
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return {
        user: null,
        error: createErrorResponse('Forbidden - Insufficient permissions', 403),
      };
    }

    return { user };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      user: null,
      error: createErrorResponse('Authentication failed', 401),
    };
  }
}

// Request validation middleware using Zod
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async function validate(req: NextRequest): Promise<{
    data?: T;
    error?: NextResponse;
  }> {
    try {
      let body;
      
      if (req.method !== 'GET') {
        const rawBody = await req.text();
        if (rawBody) {
          body = JSON.parse(rawBody);
        }
      } else {
        // For GET requests, validate query parameters
        const url = new URL(req.url);
        body = Object.fromEntries(url.searchParams.entries());
      }

      const validatedData = schema.parse(body);
      return { data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return {
          error: createErrorResponse(`Validation failed: ${errorMessage}`, 400),
        };
      }

      return {
        error: createErrorResponse('Invalid request format', 400),
      };
    }
  };
}

// CORS middleware
export function corsMiddleware(req: NextRequest): NextResponse | null {
  // Allow CORS for development
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'];

  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null; // Continue to next middleware
}

// Security headers middleware
export function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  };
}

// Main API handler wrapper
export function withApiHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    allowedRoles?: string[];
    rateLimit?: { maxRequests: number; windowMs: number };
    validationSchema?: z.ZodSchema;
  } = {}
) {
  return async function wrappedHandler(
    req: NextRequest,
    context?: any
  ): Promise<NextResponse> {
    try {
      // Apply CORS
      const corsResponse = corsMiddleware(req);
      if (corsResponse) return corsResponse;

      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimitResponse = rateLimit(
          options.rateLimit.maxRequests,
          options.rateLimit.windowMs
        )(req);
        if (rateLimitResponse) return rateLimitResponse;
      }

      // Apply authentication
      let user = null;
      if (options.requireAuth) {
        const authResult = await requireAuth(req, options.allowedRoles);
        if (authResult.error) return authResult.error;
        user = authResult.user;
      }

      // Apply validation
      let validatedData = null;
      if (options.validationSchema) {
        const validation = await validateRequest(options.validationSchema)(req);
        if (validation.error) return validation.error;
        validatedData = validation.data;
      }

      // Add user and validated data to request context
      const enhancedContext = {
        ...context,
        user,
        validatedData,
      };

      // Execute handler
      const response = await handler(req, enhancedContext);

      // Add security headers
      const headers = securityHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('API Handler Error:', error);
      return createErrorResponse('Internal server error', 500);
    }
  };
}

// Pagination helper
export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export function getPagination(searchParams: URLSearchParams): {
  skip: number;
  take: number;
  page: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
  };
}

// Database error handler
export function handlePrismaError(error: any): NextResponse {
  console.error('Database error:', error);

  if (error.code === 'P2002') {
    return createErrorResponse('A record with this data already exists', 409);
  }

  if (error.code === 'P2025') {
    return createErrorResponse('Record not found', 404);
  }

  if (error.code === 'P2003') {
    return createErrorResponse('Foreign key constraint failed', 400);
  }

  return createErrorResponse('Database operation failed', 500);
}