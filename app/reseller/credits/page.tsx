import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import ResellerCreditsClient from './page-client';

async function getResellerCreditData(resellerId: string) {
  // Get reseller's managed users
  const managedUsers = await prisma.user.findMany({
    where: { 
      creatorId: resellerId,
      role: 'USER'
    },
    select: {
      id: true,
      name: true,
      email: true,
      creditBalance: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get credit transactions for reseller and their users
  const userIds = [resellerId, ...managedUsers.map(u => u.id)];
  
  const creditTransactions = await prisma.transaction.findMany({
    where: {
      OR: [
        // Transactions where reseller received credits
        { userId: resellerId, transactionType: { in: ['CREDIT_ASSIGN', 'CREDIT_REVOKE'] } },
        // Transactions where reseller assigned credits to users
        { 
          createdById: resellerId, 
          transactionType: { in: ['CREDIT_ASSIGN', 'CREDIT_REVOKE'] }
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: {
        select: { name: true, email: true }
      },
      createdBy: {
        select: { name: true }
      }
    }
  });

  // Calculate stats
  const totalAssigned = managedUsers.reduce((sum, user) => sum + Number(user.creditBalance), 0);
  const activeUsers = managedUsers.filter(u => u.isActive).length;
  
  // Get reseller's credit balance
  const reseller = await prisma.user.findUnique({
    where: { id: resellerId },
    select: { creditBalance: true }
  });

  return {
    managedUsers,
    creditTransactions,
    stats: {
      totalAssigned,
      activeUsers,
      availableBalance: Number(reseller?.creditBalance || 0),
      totalUsers: managedUsers.length
    }
  };
}

export default async function ResellerCreditsPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'RESELLER') {
    redirect('/dashboard');
  }
  
  const creditData = await getResellerCreditData(session.id);
  
  return (
    <ResellerCreditsClient 
      creditData={creditData}
      session={session}
    />
  );
}