import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { ArrowLeft, History, TrendingUp, DollarSign, Users, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

async function getTransactions() {
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
    take: 200 // Limit to most recent 200
  });
  
  return transactions;
}

async function getShipmentHistory() {
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
    take: 100 // Limit to most recent 100
  });
  
  return shipments;
}

async function getHistoryStats() {
  const [
    totalTransactions,
    totalRevenue,
    recentTransactions,
    transactionsByType,
    shipmentsByStatus
  ] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.aggregate({
      _sum: {
        amount: true
      },
      where: {
        transactionType: {
          in: ['CREDIT_ASSIGN', 'LABEL_PURCHASE']
        }
      }
    }),
    prisma.transaction.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.transaction.groupBy({
      by: ['transactionType'],
      _count: {
        transactionType: true
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
    totalTransactions,
    totalRevenue: totalRevenue._sum.amount || 0,
    recentTransactions,
    transactionsByType: transactionsByType.reduce((acc, item) => {
      acc[item.transactionType] = item._count.transactionType;
      return acc;
    }, {} as Record<string, number>),
    shipmentsByStatus: shipmentsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>)
  };
}

export default async function AdminHistoryPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  const [transactions, shipments, historyStats] = await Promise.all([
    getTransactions(),
    getShipmentHistory(),
    getHistoryStats()
  ]);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'CREDIT_ASSIGN':
        return 'Credit Added';
      case 'CREDIT_REVOKE':
        return 'Credit Removed';
      case 'LABEL_PURCHASE':
        return 'Label Purchase';
      case 'LABEL_REFUND':
        return 'Label Refund';
      default:
        return type.replace('_', ' ').toLowerCase();
    }
  };

  const formatAmount = (type: string, amount: number) => {
    if (type === 'CREDIT_ASSIGN' || type === 'LABEL_REFUND') {
      return `+$${amount.toFixed(2)}`;
    } else if (type === 'CREDIT_REVOKE' || type === 'LABEL_PURCHASE') {
      return `-$${amount.toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PURCHASED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REFUNDED':
        return 'destructive';
      case 'ERROR':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'destructive';
      case 'RESELLER':
        return 'default';
      case 'USER':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const parseAddress = (addressJson: string) => {
    try {
      const address = JSON.parse(addressJson);
      return `${address.city}, ${address.state}`;
    } catch {
      return 'Invalid address';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Transaction History (Admin)</h1>
      </div>

      {/* History Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyStats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              All-time transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${historyStats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue generated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyStats.recentTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set([...transactions.map(t => t.userId), ...shipments.map(s => s.userId)]).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with activity
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="shipments">Shipment History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Complete transaction history across all users
                <Button variant="outline" size="sm" className="ml-4">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.user.name}</p>
                            <p className="text-sm text-gray-600">{transaction.user.email}</p>
                            <Badge variant={getRoleBadgeColor(transaction.user.role)} className="text-xs">
                              {transaction.user.role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getTransactionTypeLabel(transaction.transactionType)}</TableCell>
                        <TableCell className={transaction.transactionType === 'CREDIT_ASSIGN' ? 'text-green-600' : transaction.transactionType === 'CREDIT_REVOKE' ? 'text-red-600' : ''}>
                          {formatAmount(transaction.transactionType, Number(transaction.amount))}
                        </TableCell>
                        <TableCell>{transaction.description || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.createdBy.name}</p>
                            <Badge variant={getRoleBadgeColor(transaction.createdBy.role)} className="text-xs">
                              {transaction.createdBy.role}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No transactions found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipment History</CardTitle>
              <CardDescription>
                Complete shipping label history across all users
                <Button variant="outline" size="sm" className="ml-4">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{formatDate(shipment.createdAt)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{shipment.user.name}</p>
                            <p className="text-sm text-gray-600">{shipment.user.email}</p>
                            <Badge variant={getRoleBadgeColor(shipment.user.role)} className="text-xs">
                              {shipment.user.role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {shipment.trackingNumber ? (
                            <div className="font-mono text-sm">{shipment.trackingNumber}</div>
                          ) : (
                            <span className="text-gray-500">No tracking</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shipment.carrier ? (
                            <div>
                              <p className="font-medium">{shipment.carrier}</p>
                              <p className="text-xs text-gray-500">{shipment.serviceLevel}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{parseAddress(shipment.fromAddress)}</div>
                            <div className="text-gray-500">→ {parseAddress(shipment.toAddress)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {shipment.cost ? (
                            <span className="font-medium">${shipment.cost.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeColor(shipment.status)}>
                            {shipment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {shipments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No shipments found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transactions by Type</CardTitle>
                <CardDescription>Distribution of transaction types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(historyStats.transactionsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="font-medium">{getTransactionTypeLabel(type)}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipments by Status</CardTitle>
                <CardDescription>Distribution of shipment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(historyStats.shipmentsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeColor(status)}>
                          {status}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Reports</CardTitle>
              <CardDescription>Generate comprehensive system reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Monthly Financial Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  User Activity Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Performance Analytics
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  Revenue Analysis
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <History className="h-6 w-6 mb-2" />
                  Audit Trail Export
                </Button>
                <Button variant="outline" className="h-20 flex-col" disabled>
                  <Download className="h-6 w-6 mb-2" />
                  Custom Export
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Report generation functionality will be implemented in future updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}