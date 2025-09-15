import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await getSession(null);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only Super Admins and Resellers can assign credits
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'RESELLER') {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Validate input
    if (!data.userId || !data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      return Response.json({ error: "Invalid input. User ID and positive amount required." }, { status: 400 });
    }
    
    const userId = data.userId;
    const amount = parseFloat(data.amount);
    const description = data.description || 'Credit assignment';
    
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if the user has permission to assign credits to this user
    if (session.role === 'RESELLER') {
      // Resellers can only assign credits to their created users
      if (targetUser.creatorId !== session.id) {
        return Response.json({ error: "You can only assign credits to users you created" }, { status: 403 });
      }
      
      // Check if the reseller has enough credits
      if (Number(session.creditBalance) < parseFloat(amount.toString())) {
        return Response.json({ error: "Insufficient credit balance" }, { status: 400 });
      }
      
      // Update the reseller's balance (subtract credits)
      await prisma.user.update({
        where: { id: session.id },
        data: { creditBalance: { decrement: parseFloat(amount.toString()) } }
      });
      
      // Create transaction record for reseller (credit revoke)
      await prisma.transaction.create({
        data: {
          userId: session.id,
          transactionType: 'CREDIT_REVOKE',
          amount: parseFloat(amount.toString()),
          description: `Credits assigned to ${targetUser.name} (${targetUser.email})`,
          createdById: session.id
        }
      });
    }
    
    // Update the target user's balance (add credits)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: parseFloat(amount.toString()) } }
    });
    
    // Create transaction record for target user
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        transactionType: 'CREDIT_ASSIGN',
        amount: parseFloat(amount.toString()),
        description,
        createdById: session.id
      }
    });
    
    return Response.json({
      success: true,
      transaction,
      creditBalance: Number(updatedUser.creditBalance)
    });
    
  } catch (error) {
    console.error("Error assigning credits:", error);
    return Response.json({ error: "Failed to assign credits" }, { status: 500 });
  }
}