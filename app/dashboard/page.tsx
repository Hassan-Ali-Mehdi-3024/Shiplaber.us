import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

// Get recent activity for the user based on their role
async function getRecentActivity(userId: string, userRole: string) {
  // For Super Admin, get all recent transactions
  if (userRole === 'SUPER_ADMIN') {
    return prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        },
        createdBy: {
          select: { name: true }
        }
      }
    });
  }
  
  // For Reseller, get transactions for their users
  if (userRole === 'RESELLER') {
    const userIds = await prisma.user.findMany({
      where: { creatorId: userId },
      select: { id: true }
    });
    
    return prisma.transaction.findMany({
      where: {
        OR: [
          { userId },
          { userId: { in: userIds.map((u: { id: string }) => u.id) } }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        },
        createdBy: {
          select: { name: true }
        }
      }
    });
  }
  
  // For regular users, just get their own transactions
  return prisma.transaction.findMany({
    where: { userId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { name: true }
      }
    }
  });
}

// Get dashboard stats based on user role
async function getDashboardStats(userId: string, userRole: string) {
  let stats = {
    creditBalance: 0,
    totalLabels: 0,
    recentLabels: 0,
    totalUsers: 0
  };
  
  // Get user's credit balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true }
  });
  
  if (user) {
    stats.creditBalance = Number(user.creditBalance);
  }
  
  // Get shipment stats
  if (userRole === 'SUPER_ADMIN') {
    stats.totalLabels = await prisma.shipment.count({
      where: { status: 'PURCHASED' }
    });
    
    stats.recentLabels = await prisma.shipment.count({
      where: {
        status: 'PURCHASED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    stats.totalUsers = await prisma.user.count({
      where: { isActive: true }
    });
  } else if (userRole === 'RESELLER') {
    const userIds = await prisma.user.findMany({
      where: { creatorId: userId },
      select: { id: true }
    });
    
    const ids = [userId, ...userIds.map((u: { id: string }) => u.id)];
    
    stats.totalLabels = await prisma.shipment.count({
      where: {
        userId: { in: ids },
        status: 'PURCHASED'
      }
    });
    
    stats.recentLabels = await prisma.shipment.count({
      where: {
        userId: { in: ids },
        status: 'PURCHASED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    stats.totalUsers = await prisma.user.count({
      where: {
        creatorId: userId,
        isActive: true
      }
    });
  } else {
    stats.totalLabels = await prisma.shipment.count({
      where: {
        userId,
        status: 'PURCHASED'
      }
    });
    
    stats.recentLabels = await prisma.shipment.count({
      where: {
        userId,
        status: 'PURCHASED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
  }
  
  return stats;
}

export default async function DashboardPage() {
  const session = await getSession(null);
  
  if (!session) {
    return null;
  }
  
  const recentActivity = await getRecentActivity(session.id, session.role);
  const stats = await getDashboardStats(session.id, session.role);

  // Format date for display
  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Credit Balance</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">${stats.creditBalance.toFixed(2)}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Labels</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalLabels}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Last 7 Days</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.recentLabels} labels</p>
        </div>
        
        {(session.role === 'SUPER_ADMIN' || session.role === 'RESELLER') && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
        )}
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {(session.role === 'SUPER_ADMIN' || session.role === 'RESELLER') && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity.length > 0 ? (
                recentActivity.map((transaction: any) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    {(session.role === 'SUPER_ADMIN' || session.role === 'RESELLER') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {/* Type assertion to handle potential missing user property */}
                        {('user' in transaction && transaction.user && 'name' in (transaction.user as any)) 
                          ? (transaction.user as any).name 
                          : 'N/A'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.transactionType === 'LABEL_PURCHASE'
                          ? 'bg-red-100 text-red-800'
                          : transaction.transactionType === 'LABEL_REFUND'
                          ? 'bg-green-100 text-green-800'
                          : transaction.transactionType === 'CREDIT_ASSIGN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.transactionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      transaction.transactionType === 'CREDIT_ASSIGN' || transaction.transactionType === 'LABEL_REFUND'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.transactionType === 'CREDIT_ASSIGN' || transaction.transactionType === 'LABEL_REFUND'
                        ? `+$${transaction.amount}`
                        : `-$${transaction.amount}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.description || 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={(session.role === 'SUPER_ADMIN' || session.role === 'RESELLER') ? 5 : 4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No recent activity found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="flex flex-wrap gap-4">
          <a href="/dashboard/labels/create" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Create Label
          </a>
          <a href="/dashboard/labels/bulk" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
            Upload CSV
          </a>
          {(session.role === 'SUPER_ADMIN' || session.role === 'RESELLER') && (
            <a href="/dashboard/users/create" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
              Add User
            </a>
          )}
        </div>
      </div>
    </div>
  );
}