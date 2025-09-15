import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

// Get all transactions for a specific user
export async function GET(req: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = params.userId;
    
    // Check permission to view transactions
    if (
      session.id !== userId && // Users can see their own transactions
      session.role !== 'SUPER_ADMIN' && // Super admins can see all transactions
      !(session.role === 'RESELLER' && 
        // Resellers can only see transactions for users they created
        await prisma.user.findFirst({
          where: { 
            id: userId,
            creatorId: session.id
          }
        })
      )
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    return Response.json({ transactions });
    
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return Response.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}