import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { ArrowLeft, Package, Plus, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserLabelsClient from './page-client';

async function getUserShipments(userId: string) {
  const shipments = await prisma.shipment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20 // Most recent 20
  });
  
  return shipments;
}

async function getUserLabelStats(userId: string) {
  const [totalLabels, totalSpent, recentLabels, labelsByStatus] = await Promise.all([
    prisma.shipment.count({
      where: { userId }
    }),
    
    prisma.transaction.aggregate({
      where: {
        userId,
        transactionType: 'LABEL_PURCHASE'
      },
      _sum: { amount: true }
    }),
    
    prisma.shipment.count({
      where: { 
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    }),
    
    prisma.shipment.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true }
    })
  ]);

  return {
    totalLabels,
    totalSpent: Number(totalSpent._sum.amount) || 0,
    recentLabels,
    labelsByStatus: labelsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>)
  };
}

export default async function UserLabelsPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'USER') {
    redirect('/dashboard');
  }
  
  const shipments = await getUserShipments(session.id);
  const stats = await getUserLabelStats(session.id);
  
  return (
    <UserLabelsClient 
      shipments={shipments}
      stats={stats}
      session={session}
    />
  );
}