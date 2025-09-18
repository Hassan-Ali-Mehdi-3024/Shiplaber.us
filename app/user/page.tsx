import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

// Get recent activity for User - their own transactions only
async function getRecentActivity(userId: string) {
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

// Get dashboard stats for User
async function getDashboardStats(userId: string) {
  const totalLabels = await prisma.shipment.count({
    where: {
      userId,
      status: 'PURCHASED'
    }
  });
  
  const recentLabels = await prisma.shipment.count({
    where: {
      userId,
      status: 'PURCHASED',
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  });
  
  const todayLabels = await prisma.shipment.count({
    where: {
      userId,
      status: 'PURCHASED',
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
      }
    }
  });
  
  const monthlySpent = await prisma.transaction.aggregate({
    where: {
      userId,
      transactionType: 'LABEL_PURCHASE',
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { amount: true }
  });

  return {
    totalLabels,
    recentLabels,
    todayLabels,
    monthlySpent: Number(monthlySpent._sum.amount) || 0
  };
}

export default async function UserDashboardPage() {
  const session = await getSession(null);
  
  if (!session || session.role !== 'USER') {
    return null;
  }
  
  const recentActivity = await getRecentActivity(session.id);
  const stats = await getDashboardStats(session.id);

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back, {session.name}
        </div>
      </div>
      
      {/* User Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Available Credits</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">${session.creditBalance.toFixed(2)}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Labels</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalLabels}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Labels Today</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{stats.todayLabels}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Monthly Spent</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">${stats.monthlySpent.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">My Recent Activity</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
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
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No recent activity found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* User Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/user/labels" className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-center">
            Create Shipping Label
          </a>
          <a href="/user/batch" className="px-4 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-center">
            Bulk Upload
          </a>
          <a href="/user/history" className="px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-center">
            View History
          </a>
          <a href="/user/credits" className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition text-center">
            Check Balance
          </a>
        </div>
      </div>
    </div>
  );
}