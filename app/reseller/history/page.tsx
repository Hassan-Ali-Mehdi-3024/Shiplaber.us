import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import ResellerHistoryClient from './page-client';

async function getResellerHistory(userId: string) {
  // Get all users in the reseller's network
  const networkUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: userId }, // Reseller themselves
        { creatorId: userId } // Users created by reseller
      ]
    },
    select: { id: true, name: true, email: true }
  });

  const userIds = networkUsers.map(user => user.id);

  const [transactions, recentLabels, networkStats] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      take: 100,
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
      }
    }),
    prisma.shipment.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        cost: true,
        carrier: true,
        serviceLevel: true,
        createdAt: true,
        toAddress: true,
        fromAddress: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    // Network statistics
    Promise.all([
      prisma.transaction.aggregate({
        where: { 
          userId: { in: userIds },
          transactionType: 'LABEL_PURCHASE'
        },
        _sum: { amount: true }
      }),
      prisma.shipment.count({
        where: { userId: { in: userIds } }
      }),
      prisma.transaction.aggregate({
        where: { 
          userId: { in: userIds },
          transactionType: 'CREDIT_ASSIGN'
        },
        _sum: { amount: true }
      }),
      prisma.user.aggregate({
        where: { id: { in: userIds } },
        _sum: { creditBalance: true }
      })
    ])
  ]);

  const [totalSpent, labelCount, totalCreditsAssigned, totalCreditBalance] = networkStats;

  return {
    transactions,
    recentLabels,
    networkUsers,
    stats: {
      totalNetworkSpent: Math.abs(totalSpent._sum.amount || 0),
      networkLabelCount: labelCount,
      totalCreditsAssigned: totalCreditsAssigned._sum.amount || 0,
      networkCreditBalance: totalCreditBalance._sum.creditBalance || 0,
      networkSize: networkUsers.length
    }
  };
}

export default async function ResellerHistoryPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'RESELLER') {
    redirect('/dashboard');
  }
  
  const historyData = await getResellerHistory(session.id);
  
  return (
    <ResellerHistoryClient 
      historyData={historyData}
      session={session}
    />
  );
}