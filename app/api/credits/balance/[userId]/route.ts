import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = params.userId;
    
    // Check permission to view credit balance
    if (
      session.id !== userId && // Users can see their own balance
      session.role !== 'SUPER_ADMIN' // Super Admins can see any balance
    ) {
      // Check if the user is a reseller and is requesting balance of a user they created
      if (session.role === 'RESELLER') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { creatorId: true }
        });
        
        if (!user || user.creatorId !== session.id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Get user credit balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        name: true,
        email: true,
        role: true,
        creditBalance: true
      }
    });
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    return Response.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      creditBalance: Number(user.creditBalance)
    });
    
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    return Response.json({ error: "Failed to fetch credit balance" }, { status: 500 });
  }
}