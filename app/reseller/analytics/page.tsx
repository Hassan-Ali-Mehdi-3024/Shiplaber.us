import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import ResellerAnalyticsClient from './page-client';

async function getResellerAnalyticsData(resellerId: string) {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  // Get reseller's managed users
  const managedUsers = await prisma.user.findMany({
    where: { 
      creatorId: resellerId,
      role: 'USER'
    },
    select: { id: true, name: true, creditBalance: true, isActive: true, createdAt: true }
  });

  const userIds = [resellerId, ...managedUsers.map(u => u.id)];

  const [
    totalShipments,
    recentShipments,
    totalRevenue,
    recentRevenue,
    totalTransactions,
    shipmentsByStatus,
    carrierDistribution,
    topDestinations,
    dailyActivity
  ] = await Promise.all([
    // Total shipments by managed users
    prisma.shipment.count({
      where: { userId: { in: userIds } }
    }),
    
    // Recent shipments (last 7 days)
    prisma.shipment.count({
      where: { 
        userId: { in: userIds },
        createdAt: { gte: lastWeek }
      }
    }),
    
    // Total revenue from label purchases
    prisma.transaction.aggregate({
      where: {
        userId: { in: userIds },
        transactionType: 'LABEL_PURCHASE'
      },
      _sum: { amount: true }
    }),
    
    // Recent revenue (last 7 days)
    prisma.transaction.aggregate({
      where: {
        userId: { in: userIds },
        transactionType: 'LABEL_PURCHASE',
        createdAt: { gte: lastWeek }
      },
      _sum: { amount: true }
    }),
    
    // Total transactions
    prisma.transaction.count({
      where: { userId: { in: userIds } }
    }),
    
    // Shipments by status
    prisma.shipment.groupBy({
      by: ['status'],
      where: { userId: { in: userIds } },
      _count: { status: true }
    }),
    
    // Carrier distribution
    prisma.shipment.groupBy({
      by: ['carrier'],
      where: { 
        userId: { in: userIds },
        carrier: { not: null }
      },
      _count: { carrier: true }
    }),
    
    // Top destinations
    prisma.shipment.findMany({
      where: { 
        userId: { in: userIds },
        status: 'PURCHASED'
      },
      select: { toAddress: true },
      take: 100
    }).then(shipments => {
      const destinations: Record<string, number> = {};
      shipments.forEach(shipment => {
        try {
          const address = JSON.parse(shipment.toAddress);
          const key = `${address.city}, ${address.state}`;
          destinations[key] = (destinations[key] || 0) + 1;
        } catch (e) {
          // Skip invalid JSON
        }
      });
      return Object.entries(destinations)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([destination, count]) => ({ destination, count }));
    }),
    
    // Daily activity for last 30 days
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Shipment"
      WHERE "userId" = ANY(${userIds})
        AND "createdAt" >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    ` as Promise<Array<{ date: string; count: bigint }>>
  ]);

  // Calculate additional metrics
  const totalCreditsAssigned = managedUsers.reduce((sum, user) => sum + Number(user.creditBalance), 0);
  const activeUsers = managedUsers.filter(u => u.isActive).length;

  return {
    overview: {
      totalUsers: managedUsers.length,
      activeUsers,
      totalShipments,
      recentShipments,
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      recentRevenue: Number(recentRevenue._sum.amount) || 0,
      totalTransactions,
      totalCreditsAssigned
    },
    distributions: {
      shipmentsByStatus: shipmentsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      carrierDistribution: carrierDistribution.reduce((acc, item) => {
        if (item.carrier) {
          acc[item.carrier] = item._count.carrier;
        }
        return acc;
      }, {} as Record<string, number>)
    },
    charts: {
      topDestinations,
      dailyActivity: dailyActivity.map((item: any) => ({
        date: item.date,
        count: Number(item.count)
      })),
      userGrowth: managedUsers.map(user => ({
        date: user.createdAt,
        count: 1 // Simplified for now
      }))
    },
    managedUsers
  };
}

export default async function ResellerAnalyticsPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'RESELLER') {
    redirect('/dashboard');
  }
  
  const analyticsData = await getResellerAnalyticsData(session.id);
  
  return (
    <ResellerAnalyticsClient 
      analyticsData={analyticsData}
      session={session}
    />
  );
}