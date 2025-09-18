import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { ArrowLeft, Plus, User, Mail, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ResellerUsersClient from './page-client';

async function getResellerUsers(resellerId: string) {
  // Get users created by this reseller only
  const users = await prisma.user.findMany({
    where: { 
      creatorId: resellerId,
      role: 'USER' // Resellers can only create regular users
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          shipments: {
            where: { status: 'PURCHASED' }
          },
          sentTransactions: true
        }
      }
    }
  });

  return users;
}

async function getResellerStats(resellerId: string) {
  // Get reseller's managed users
  const managedUsers = await prisma.user.findMany({
    where: { 
      creatorId: resellerId,
      role: 'USER'
    },
    select: { 
      id: true, 
      creditBalance: true,
      isActive: true 
    }
  });

  const totalUsers = managedUsers.length;
  const activeUsers = managedUsers.filter(u => u.isActive).length;
  const totalCreditsDistributed = managedUsers.reduce((sum, user) => sum + Number(user.creditBalance), 0);

  // Get total labels created by managed users
  const userIds = managedUsers.map(u => u.id);
  const totalLabels = await prisma.shipment.count({
    where: {
      userId: { in: userIds },
      status: 'PURCHASED'
    }
  });

  return {
    totalUsers,
    activeUsers,
    totalCreditsDistributed,
    totalLabels
  };
}

export default async function ResellerUsersPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'RESELLER') {
    redirect('/dashboard');
  }
  
  const users = await getResellerUsers(session.id);
  const stats = await getResellerStats(session.id);
  
  return (
    <ResellerUsersClient 
      users={users}
      stats={stats}
      session={session}
    />
  );
}