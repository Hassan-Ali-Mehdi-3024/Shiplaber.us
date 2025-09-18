'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History, Package, DollarSign, Calendar, Filter, ExternalLink, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';

type Transaction = {
  id: string;
  transactionType: string;
  amount: number;
  description: string | null;
  referenceId: string | null;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type Shipment = {
  id: string;
  trackingNumber: string | null;
  status: string;
  cost: number | null;
  carrier: string | null;
  serviceLevel: string | null;
  createdAt: Date;
  toAddress: string;
};

type HistoryData = {
  transactions: Transaction[];
  recentLabels: Shipment[];
  stats: {
    totalSpent: number;
    labelCount: number;
    creditBalance: number;
  };
};

type Session = {
  id: string;
  role: string;
  name?: string;
  creditBalance?: number;
};

interface UserHistoryClientProps {
  historyData: HistoryData;
  session: Session;
}

export default function UserHistoryClient({ historyData, session }: UserHistoryClientProps) {
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CREDIT_ASSIGN': 'Credit Added',
      'CREDIT_REVOKE': 'Credit Removed',
      'LABEL_PURCHASE': 'Label Purchase',
      'LABEL_REFUND': 'Label Refund',
      'ADJUSTMENT': 'Adjustment'
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'CREDIT_ASSIGN': 'text-green-600',
      'CREDIT_REVOKE': 'text-red-600',
      'LABEL_PURCHASE': 'text-blue-600',
      'LABEL_REFUND': 'text-green-600',
      'ADJUSTMENT': 'text-yellow-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const getAddressString = (addressJson: string) => {
    try {
      const address = JSON.parse(addressJson);
      return `${address.city}, ${address.state}`;
    } catch {
      return 'Unknown';
    }
  };

  // Filter transactions
  const filteredTransactions = historyData.transactions.filter(transaction => {
    if (transactionFilter !== 'all' && transaction.transactionType !== transactionFilter) {
      return false;
    }
    
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case '7d':
          return transactionDate > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
          return transactionDate > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
          return transactionDate > new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    }
    
    return true;
  });

  const transactionColumns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: 'Type',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className={`font-medium ${getTransactionTypeColor(row.original.transactionType)}`}>
            {getTransactionTypeLabel(row.original.transactionType)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className={`text-sm font-medium ${row.original.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {row.original.amount >= 0 ? '+' : ''}{formatCurrency(row.original.amount)}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 max-w-48 truncate">
          {row.original.description || 'No description'}
        </div>
      ),
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.createdBy ? (
            <div>
              <div className="font-medium">{row.original.createdBy.name}</div>
              <div className="text-gray-500">{row.original.createdBy.email}</div>
            </div>
          ) : (
            <span className="text-gray-400">System</span>
          )}
        </div>
      ),
    },
  ];

  const shipmentColumns: ColumnDef<Shipment>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      accessorKey: 'trackingNumber',
      header: 'Tracking',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.trackingNumber || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'toAddress',
      header: 'Destination',
      cell: ({ row }) => (
        <div className="text-sm">
          {getAddressString(row.original.toAddress)}
        </div>
      ),
    },
    {
      accessorKey: 'carrier',
      header: 'Service',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.carrier || 'Unknown'}</div>
          <div className="text-gray-500">{row.original.serviceLevel || 'N/A'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-red-600">
          {row.original.cost ? formatCurrency(row.original.cost) : 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status}
          variant="shipment"
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {row.original.trackingNumber && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`https://www.google.com/search?q=${row.original.trackingNumber}+tracking`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Track
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/user" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">My History</h1>
          <Badge variant="secondary">User</Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(historyData.stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime shipping costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labels Created</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyData.stats.labelCount}</div>
            <p className="text-xs text-muted-foreground">
              Total shipping labels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(historyData.stats.creditBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Available for shipping
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="labels">Shipping Labels</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Transaction Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Transaction Type</label>
                  <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="CREDIT_ASSIGN">Credit Added</SelectItem>
                      <SelectItem value="CREDIT_REVOKE">Credit Removed</SelectItem>
                      <SelectItem value="LABEL_PURCHASE">Label Purchase</SelectItem>
                      <SelectItem value="LABEL_REFUND">Label Refund</SelectItem>
                      <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your credit and shipping transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transactionColumns}
                data={filteredTransactions}
                searchPlaceholder="Search transactions..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Shipping Labels</CardTitle>
              <CardDescription>
                Your most recent shipping label activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={shipmentColumns}
                data={historyData.recentLabels}
                searchPlaceholder="Search labels..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}