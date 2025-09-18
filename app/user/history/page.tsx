import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import UserHistoryClient from './page-client';

async function getUserTransactions(userId: string) {
  const [transactions, recentLabels, totalSpent, labelCount] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    prisma.shipment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        cost: true,
        carrier: true,
        serviceLevel: true,
        createdAt: true,
        toAddress: true
      }
    }),
    prisma.transaction.aggregate({
      where: { 
        userId,
        transactionType: 'LABEL_PURCHASE'
      },
      _sum: { amount: true }
    }),
    prisma.shipment.count({
      where: { userId }
    })
  ]);

  return {
    transactions,
    recentLabels,
    stats: {
      totalSpent: Math.abs(totalSpent._sum.amount || 0),
      labelCount,
      creditBalance: 0 // Will be updated from session
    }
  };
}

export default async function UserHistoryPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'USER') {
    redirect('/dashboard');
  }
  
  const historyData = await getUserTransactions(session.id);
  
  // Update credit balance from session
  historyData.stats.creditBalance = session.creditBalance || 0;
  
  return (
    <UserHistoryClient 
      historyData={historyData}
      session={session}
    />
  );
}