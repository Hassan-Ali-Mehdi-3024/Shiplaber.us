'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Plus, History, Download, Eye, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { ShippingLabelForm } from '@/components/labels/shipping-label-form';
import { ColumnDef } from '@tanstack/react-table';

type Shipment = {
  id: string;
  shippoTransactionId: string | null;
  trackingNumber: string | null;
  labelUrl: string | null;
  cost: number | null;
  carrier: string | null;
  serviceLevel: string | null;
  fromAddress: string;
  toAddress: string;
  parcelDetails: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type Stats = {
  totalLabels: number;
  totalSpent: number;
  recentLabels: number;
  labelsByStatus: Record<string, number>;
};

type Session = {
  id: string;
  role: string;
  name?: string;
  creditBalance?: number;
};

interface UserLabelsClientProps {
  shipments: Shipment[];
  stats: Stats;
  session: Session;
}

export default function UserLabelsClient({ shipments, stats, session }: UserLabelsClientProps) {
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const getAddressString = (addressJson: string) => {
    try {
      const address = JSON.parse(addressJson);
      return `${address.name}, ${address.street1}, ${address.city}, ${address.state} ${address.zip}`;
    } catch {
      return 'Invalid address';
    }
  };

  const handleLabelCreated = () => {
    setShowCreateLabel(false);
    window.location.reload(); // Refresh to show new label
  };

  const handleRefund = async (shipment: Shipment) => {
    if (!confirm(`Are you sure you want to refund this label? You will receive ${formatCurrency(shipment.cost || 0)} back to your credits.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/labels/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: shipment.shippoTransactionId
        })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Refund failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<Shipment>[] = [
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
      accessorKey: 'fromAddress',
      header: 'From → To',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium truncate max-w-48">
            {getAddressString(row.original.fromAddress)}
          </div>
          <div className="text-gray-500 truncate max-w-48">
            → {getAddressString(row.original.toAddress)}
          </div>
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
        <div className="text-sm font-medium text-green-600">
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
          {row.original.labelUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(row.original.labelUrl!, '_blank')}
            >
              <Download className="h-3 w-3 mr-1" />
              Label
            </Button>
          )}
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
          {row.original.status === 'PURCHASED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRefund(row.original)}
              disabled={loading}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refund
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (showCreateLabel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowCreateLabel(false)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Create Shipping Label</h1>
          <Badge variant="secondary">User</Badge>
        </div>
        
        <ShippingLabelForm 
          userCredits={session.creditBalance || 0}
          onSuccess={handleLabelCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/user" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Shipping Labels</h1>
          <Badge variant="secondary">User</Badge>
        </div>
        
        <Button onClick={() => setShowCreateLabel(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Label
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(session.creditBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Available for shipping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labels</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLabels}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentLabels} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              On shipping labels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Labels</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.labelsByStatus.PURCHASED || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready to ship
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common shipping tasks and operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={() => setShowCreateLabel(true)}
              className="h-20 flex flex-col space-y-2"
            >
              <Plus className="h-6 w-6" />
              <span>Create New Label</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/user/batch'}
              className="h-20 flex flex-col space-y-2"
            >
              <Package className="h-6 w-6" />
              <span>Bulk Labels</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/user/history'}
              className="h-20 flex flex-col space-y-2"
            >
              <History className="h-6 w-6" />
              <span>View History</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Labels */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Shipping Labels</CardTitle>
          <CardDescription>
            Your latest shipping labels and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={shipments}
            searchPlaceholder="Search labels..."
          />
        </CardContent>
      </Card>

      {/* Status Distribution */}
      {Object.keys(stats.labelsByStatus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Label Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.labelsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / stats.totalLabels) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}