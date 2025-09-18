import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import AdminAnalyticsClient from './page-client';

async function getAnalyticsData() {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);
  const lastYear = new Date(today);
  lastYear.setFullYear(today.getFullYear() - 1);

  const [
    totalUsers,
    totalShipments,
    totalTransactions,
    totalRevenue,
    recentUsers,
    recentShipments,
    recentRevenue,
    usersByRole,
    shipmentsByStatus,
    transactionsByType,
    carrierDistribution,
    topDestinations,
    dailyShipments,
    monthlyRevenue
  ] = await Promise.all([
    // Total counts
    prisma.user.count(),
    prisma.shipment.count(),
    prisma.transaction.count(),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { transactionType: { in: ['CREDIT_ASSIGN', 'LABEL_PURCHASE'] } }
    }),
    
    // Recent activity (last 7 days)
    prisma.user.count({
      where: { createdAt: { gte: lastWeek } }
    }),
    prisma.shipment.count({
      where: { createdAt: { gte: lastWeek } }
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        createdAt: { gte: lastWeek },
        transactionType: { in: ['CREDIT_ASSIGN', 'LABEL_PURCHASE'] }
      }
    }),
    
    // Distributions
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    }),
    prisma.shipment.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.transaction.groupBy({
      by: ['transactionType'],
      _count: { transactionType: true }
    }),
    
    // Carrier distribution
    prisma.shipment.groupBy({
      by: ['carrier'],
      _count: { carrier: true },
      where: { carrier: { not: null } }
    }),
    
    // Top destinations (simplified)
    prisma.shipment.findMany({
      select: { toAddress: true },
      where: { status: 'PURCHASED' },
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
    
    // Daily shipments for last 30 days
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Shipment"
      WHERE "createdAt" >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    ` as Promise<Array<{ date: string; count: bigint }>>,
    
    // Monthly revenue for last 12 months
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as revenue
      FROM "Transaction"
      WHERE "createdAt" >= ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
        AND "transactionType" IN ('CREDIT_ASSIGN', 'LABEL_PURCHASE')
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
      LIMIT 12
    ` as Promise<Array<{ month: string; revenue: number | null }>>
  ]);

  return {
    overview: {
      totalUsers,
      totalShipments,
      totalTransactions,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentUsers,
      recentShipments,
      recentRevenue: recentRevenue._sum.amount || 0
    },
    distributions: {
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
      shipmentsByStatus: shipmentsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      transactionsByType: transactionsByType.reduce((acc, item) => {
        acc[item.transactionType] = item._count.transactionType;
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
      dailyShipments: dailyShipments.map((item: any) => ({
        date: item.date,
        count: Number(item.count)
      })),
      monthlyRevenue: monthlyRevenue.map((item: any) => ({
        month: item.month,
        revenue: Number(item.revenue || 0)
      }))
    }
  };
}

export default async function AdminAnalyticsPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  const analyticsData = await getAnalyticsData();
  
  return (
    <AdminAnalyticsClient 
      analyticsData={analyticsData}
      session={session}
    />
  );
}