import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

// Get transaction history with pagination
export async function GET(req: Request) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    // Filter by transaction type if provided
    if (type) {
      where.transactionType = type;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        // Add one day to include the end date fully
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        where.createdAt.lte = endDateObj;
      }
    }
    
    // For regular users, only show their own transactions
    if (session.role === 'USER') {
      where.userId = session.id;
    } 
    // For resellers, show their transactions and transactions of users they created
    else if (session.role === 'RESELLER') {
      where.OR = [
        { userId: session.id },
        { user: { creatorId: session.id } }
      ];
    }
    // Super admin can see all transactions
    
    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    return Response.json({
      transactions,
      page,
      limit,
      totalCount,
      totalPages
    });
    
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch transactions" 
    }, { status: 500 });
  }
}