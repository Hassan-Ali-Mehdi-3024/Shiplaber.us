import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { ArrowLeft, Package, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

async function getShipments() {
  const shipments = await prisma.shipment.findMany({
    include: {
      user: {
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
    take: 50 // Limit to most recent 50 for performance
  });
  
  return shipments;
}

async function getLabelStats() {
  const [totalLabels, totalCost, recentLabels, labelsByStatus] = await Promise.all([
    prisma.shipment.count(),
    prisma.shipment.aggregate({
      _sum: {
        cost: true
      },
      where: {
        status: 'PURCHASED'
      }
    }),
    prisma.shipment.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.shipment.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
  ]);
  
  return {
    totalLabels,
    totalRevenue: totalCost._sum.cost || 0,
    recentLabels,
    labelsByStatus: labelsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>)
  };
}

export default async function AdminLabelsPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  const [shipments, labelStats] = await Promise.all([
    getShipments(),
    getLabelStats()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Shipping Labels (Admin)</h1>
      </div>

      {/* Label Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labels</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labelStats.totalLabels}</div>
            <p className="text-xs text-muted-foreground">
              All-time labels created
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${labelStats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From purchased labels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Labels</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labelStats.recentLabels}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {labelStats.totalLabels > 0 ? 
                Math.round(((labelStats.labelsByStatus['PURCHASED'] || 0) / labelStats.totalLabels) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Labels Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Shipping Labels</CardTitle>
          <CardDescription>Latest {shipments.length} shipping labels across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Enhanced Labels Management</h3>
            <p className="text-gray-600 mb-4">
              Advanced filtering, search, and management features will be implemented in the next iteration.
            </p>
            <div className="text-sm text-gray-500 space-y-2">
              <p>• Advanced search and filtering capabilities</p>
              <p>• Bulk operations for label management</p>
              <p>• Detailed label analytics and reporting</p>
              <p>• Integration with shipping carriers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}