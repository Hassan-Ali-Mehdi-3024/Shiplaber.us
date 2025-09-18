import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

// Get recent activity for Super Admin - all transactions
async function getRecentActivity() {
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

// Get comprehensive dashboard stats for Super Admin
async function getDashboardStats() {
  const creditBalance = await prisma.user.aggregate({
    _sum: { creditBalance: true }
  });
  
  const totalLabels = await prisma.shipment.count({
    where: { status: 'PURCHASED' }
  });
  
  const recentLabels = await prisma.shipment.count({
    where: {
      status: 'PURCHASED',
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  });
  
  const totalUsers = await prisma.user.count({
    where: { isActive: true }
  });
  
  const totalResellers = await prisma.user.count({
    where: { role: 'RESELLER', isActive: true }
  });
  
  const monthlyRevenue = await prisma.transaction.aggregate({
    where: {
      transactionType: 'LABEL_PURCHASE',
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { amount: true }
  });

  return {
    totalCreditsInSystem: Number(creditBalance._sum.creditBalance) || 0,
    totalLabels,
    recentLabels,
    totalUsers,
    totalResellers,
    monthlyRevenue: Number(monthlyRevenue._sum.amount) || 0
  };
}

export default async function AdminDashboardPage() {
  const session = await getSession(null);
  
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
    return null;
  }
  
  const recentActivity = await getRecentActivity();
  const stats = await getDashboardStats();

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
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back, {session.name}
        </div>
      </div>
      
      {/* Admin Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">My Credits</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">${session.creditBalance.toFixed(2)}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total System Credits</h3>
          <p className="mt-2 text-2xl font-bold text-blue-600">${stats.totalCreditsInSystem.toFixed(2)}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="mt-2 text-2xl font-bold text-green-600">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Resellers</h3>
          <p className="mt-2 text-2xl font-bold text-purple-600">{stats.totalResellers}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Labels</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalLabels}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
          <p className="mt-2 text-2xl font-bold text-green-600">${stats.monthlyRevenue.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent System Activity</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.user ? transaction.user.name : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.user?.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : transaction.user?.role === 'RESELLER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.user?.role || 'N/A'}
                      </span>
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
                  <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No recent activity found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Admin Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/users" className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-center">
            Manage All Users
          </a>
          <a href="/admin/credits" className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition text-center">
            Credit Management
          </a>
          <a href="/admin/analytics" className="px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-center">
            System Analytics
          </a>
          <a href="/admin/labels" className="px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-center">
            All Shipping Labels
          </a>
          <a href="/admin/batch" className="px-4 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-center">
            Batch Processing
          </a>
          <a href="/admin/history" className="px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-center">
            Transaction History
          </a>
        </div>
      </div>
    </div>
  );
}