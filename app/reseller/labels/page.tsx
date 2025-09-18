import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import ResellerLabelsClient from './page-client';

async function getResellerShipments(resellerId: string) {
  // Get reseller's managed users
  const managedUsers = await prisma.user.findMany({
    where: { 
      creatorId: resellerId,
      role: 'USER'
    },
    select: { id: true }
  });

  const userIds = [resellerId, ...managedUsers.map(u => u.id)];

  // Get shipments for reseller and their users
  const shipments = await prisma.shipment.findMany({
    where: { userId: { in: userIds } },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100 // Limit for performance
  });
  
  return shipments;
}

async function getResellerLabelStats(resellerId: string) {
  // Get reseller's managed users
  const managedUsers = await prisma.user.findMany({
    where: { 
      creatorId: resellerId,
      role: 'USER'
    },
    select: { id: true }
  });

  const userIds = [resellerId, ...managedUsers.map(u => u.id)];

  const [totalLabels, totalNetworkSpent, recentLabels, labelsByStatus, labelsByUser] = await Promise.all([
    prisma.shipment.count({
      where: { userId: { in: userIds } }
    }),
    
    prisma.transaction.aggregate({
      where: {
        userId: { in: userIds },
        transactionType: 'LABEL_PURCHASE'
      },
      _sum: { amount: true }
    }),
    
    prisma.shipment.count({
      where: { 
        userId: { in: userIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    }),
    
    prisma.shipment.groupBy({
      by: ['status'],
      where: { userId: { in: userIds } },
      _count: { status: true }
    }),

    // Get label count by user
    prisma.shipment.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { userId: true }
    })
  ]);

  return {
    totalLabels,
    totalNetworkSpent: Number(totalNetworkSpent._sum.amount) || 0,
    recentLabels,
    labelsByStatus: labelsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>),
    labelsByUser: labelsByUser,
    networkSize: managedUsers.length + 1 // +1 for reseller
  };
}

export default async function ResellerLabelsPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'RESELLER') {
    redirect('/dashboard');
  }
  
  const shipments = await getResellerShipments(session.id);
  const stats = await getResellerLabelStats(session.id);
  
  return (
    <ResellerLabelsClient 
      shipments={shipments}
      stats={stats}
      session={session}
    />
  );
}