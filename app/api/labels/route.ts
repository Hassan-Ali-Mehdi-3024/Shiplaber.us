import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

// Get all shipping labels for the current user or a specific user (for admins/resellers)
export async function GET(req: Request) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where condition based on permissions
    let where: any = {};
    
    if (userId) {
      // Only allow viewing other users' labels if admin or appropriate reseller
      if (session.id !== userId) {
        if (session.role === 'SUPER_ADMIN') {
          // Super admin can view any user's labels
          where.userId = userId;
        } else if (session.role === 'RESELLER') {
          // Check if the requested user is created by this reseller
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!user || user.creatorId !== session.id) {
            return Response.json({ error: "You don&apos;t have permission to view this user&apos;s labels" }, { status: 403 });
          }
          
          where.userId = userId;
        } else {
          // Regular users can only view their own labels
          return Response.json({ error: "You don&apos;t have permission to view this user&apos;s labels" }, { status: 403 });
        }
      } else {
        // User is requesting their own labels
        where.userId = session.id;
      }
    } else {
      // No specific user requested, show current user's labels
      where.userId = session.id;
    }
    
    // Add status filter if provided
    if (status) {
      where.status = status;
    }
    
    // Get shipments with pagination
    const [shipments, totalCount] = await Promise.all([
      prisma.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.shipment.count({ where })
    ]);
    
    return Response.json({
      shipments,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch shipments" 
    }, { status: 500 });
  }
}