import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import AdminCreditsClient from './page-client';

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      creditBalance: true,
      createdAt: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return users;
}

async function getRecentTransactions() {
  const transactions = await prisma.transaction.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });
  
  return transactions;
}

async function getCreditStats() {
  const [totalCredits, totalUsers, totalTransactions] = await Promise.all([
    prisma.user.aggregate({
      _sum: {
        creditBalance: true
      }
    }),
    prisma.user.count(),
    prisma.transaction.count({
      where: {
        transactionType: {
          in: ['CREDIT_ASSIGN', 'CREDIT_REVOKE']
        }
      }
    })
  ]);
  
  return {
    totalCreditsInSystem: totalCredits._sum.creditBalance || 0,
    totalUsers,
    totalCreditTransactions: totalTransactions
  };
}

export default async function AdminCreditsPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  const [users, recentTransactions, creditStats] = await Promise.all([
    getUsers(),
    getRecentTransactions(),
    getCreditStats()
  ]);
  
  return (
    <AdminCreditsClient 
      users={users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString()
      }))}
      recentTransactions={recentTransactions.map(transaction => ({
        ...transaction,
        description: transaction.description || '',
        createdAt: transaction.createdAt.toISOString()
      }))}
      creditStats={creditStats}
      session={session}
    />
  );
}