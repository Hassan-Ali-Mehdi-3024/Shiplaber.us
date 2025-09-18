import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { ArrowLeft, Upload, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

async function getBatches() {
  const batches = await prisma.batch.findMany({
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
  
  return batches;
}

async function getBatchStats() {
  const [totalBatches, activeBatches, completedBatches, failedBatches, batchesByStatus] = await Promise.all([
    prisma.batch.count(),
    prisma.batch.count({
      where: {
        status: 'PROCESSING'
      }
    }),
    prisma.batch.count({
      where: {
        status: 'COMPLETED'
      }
    }),
    prisma.batch.count({
      where: {
        status: 'FAILED'
      }
    }),
    prisma.batch.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
  ]);
  
  return {
    totalBatches,
    activeBatches,
    completedBatches,
    failedBatches,
    batchesByStatus: batchesByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>)
  };
}

export default async function AdminBatchPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  const [batches, batchStats] = await Promise.all([
    getBatches(),
    getBatchStats()
  ]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'PROCESSING':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Batch Processing (Admin)</h1>
      </div>

      {/* Batch Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchStats.totalBatches}</div>
            <p className="text-xs text-muted-foreground">
              All-time batch uploads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchStats.activeBatches}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchStats.completedBatches}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchStats.failedBatches}</div>
            <p className="text-xs text-muted-foreground">
              Processing failures
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="batches">All Batches</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Processing History</CardTitle>
              <CardDescription>All batch uploads and processing status across the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>{formatDate(batch.createdAt)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{batch.user.name}</p>
                            <p className="text-sm text-gray-600">{batch.user.email}</p>
                            <Badge variant={getRoleBadgeColor(batch.user.role)} className="text-xs">
                              {batch.user.role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {batch.filename || 'Unknown file'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(batch.status)}
                            <Badge variant={getStatusBadgeColor(batch.status)}>
                              {batch.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {batch.totalRows ? (
                            <div>
                              <div className="text-sm font-medium">
                                {batch.processedRows} / {batch.totalRows}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.round((batch.processedRows / batch.totalRows) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-green-600">✓ {batch.successfulRows}</div>
                            {batch.failedRows > 0 && (
                              <div className="text-red-600">✗ {batch.failedRows}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {batch.completedAt ? (
                            <div className="text-sm">
                              {Math.round(
                                (new Date(batch.completedAt).getTime() - 
                                 new Date(batch.createdAt).getTime()) / 1000 / 60
                              )} min
                            </div>
                          ) : (
                            <span className="text-gray-500">Processing...</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {batches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No batch operations found.
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
                <CardTitle>Batches by Status</CardTitle>
                <CardDescription>Distribution of batch processing states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(batchStats.batchesByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
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

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Batch processing performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Success Rate</span>
                    <span className="font-medium">
                      {batchStats.totalBatches > 0 ? 
                        Math.round((batchStats.completedBatches / batchStats.totalBatches) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Failure Rate</span>
                    <span className="font-medium text-red-600">
                      {batchStats.totalBatches > 0 ? 
                        Math.round((batchStats.failedBatches / batchStats.totalBatches) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Processes</span>
                    <span className="font-medium text-blue-600">
                      {batchStats.activeBatches}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Management Tools</CardTitle>
              <CardDescription>Administrative tools for managing batch operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Batch Management</h3>
                <p className="text-gray-600 mb-4">
                  Administrative tools for batch processing management will be implemented in future updates.
                </p>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>• Batch queue management</p>
                  <p>• Priority processing controls</p>
                  <p>• Error log analysis tools</p>
                  <p>• Batch retry mechanisms</p>
                  <p>• Performance optimization settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}