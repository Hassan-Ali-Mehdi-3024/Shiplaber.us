import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await getSession(null);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only Super Admins and Resellers can revoke credits
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
    const description = data.description || 'Credit revocation';
    
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if the user has permission to revoke credits from this user
    if (session.role === 'RESELLER') {
      // Resellers can only revoke credits from their created users
      if (targetUser.creatorId !== session.id) {
        return Response.json({ error: "You can only revoke credits from users you created" }, { status: 403 });
      }
    }
    
    // Check if the target user has enough credits
    if (Number(targetUser.creditBalance) < parseFloat(amount.toString())) {
      return Response.json({ error: "User has insufficient credit balance" }, { status: 400 });
    }
    
    // Update the target user's balance (subtract credits)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: parseFloat(amount.toString()) } }
    });
    
    // If reseller is revoking credits, add to their balance
    if (session.role === 'RESELLER') {
      await prisma.user.update({
        where: { id: session.id },
        data: { creditBalance: { increment: parseFloat(amount.toString()) } }
      });
      
      // Create transaction record for reseller (credit assign)
      await prisma.transaction.create({
        data: {
          userId: session.id,
          transactionType: 'CREDIT_ASSIGN',
          amount: parseFloat(amount.toString()),
          description: `Credits reclaimed from ${targetUser.name} (${targetUser.email})`,
          createdById: session.id
        }
      });
    }
    
    // Create transaction record for target user
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        transactionType: 'CREDIT_REVOKE',
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
    console.error("Error revoking credits:", error);
    return Response.json({ error: "Failed to revoke credits" }, { status: 500 });
  }
}