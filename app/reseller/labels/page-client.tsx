'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Plus, History, Download, Eye, RefreshCw, ExternalLink, Users, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { ShippingLabelForm } from '@/components/labels/shipping-label-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';

type Shipment = {
  id: string;
  userId: string;
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
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type Stats = {
  totalLabels: number;
  totalNetworkSpent: number;
  recentLabels: number;
  labelsByStatus: Record<string, number>;
  labelsByUser: Array<{ userId: string; _count: { userId: number } }>;
  networkSize: number;
};

type Session = {
  id: string;
  role: string;
  name?: string;
  creditBalance?: number;
};

interface ResellerLabelsClientProps {
  shipments: Shipment[];
  stats: Stats;
  session: Session;
}

export default function ResellerLabelsClient({ shipments, stats, session }: ResellerLabelsClientProps) {
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [filteredShipments, setFilteredShipments] = useState(shipments);

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

  // Get unique users for filter dropdown
  const uniqueUsers = shipments.reduce((acc, shipment) => {
    if (!acc.find(u => u.id === shipment.user.id)) {
      acc.push(shipment.user);
    }
    return acc;
  }, [] as Array<{ id: string; name: string; email: string; role: string }>);

  // Apply filters
  useEffect(() => {
    let filtered = shipments;
    
    if (userFilter !== 'all') {
      filtered = filtered.filter(s => s.userId === userFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    setFilteredShipments(filtered);
  }, [userFilter, statusFilter, shipments]);

  const handleLabelCreated = () => {
    setShowCreateLabel(false);
    window.location.reload(); // Refresh to show new label
  };

  const handleRefund = async (shipment: Shipment) => {
    // Only allow refunding labels created by reseller or their users
    if (shipment.userId !== session.id && shipment.user.role !== 'USER') {
      alert('You can only refund labels created by you or your users.');
      return;
    }

    if (!confirm(`Are you sure you want to refund this label? ${formatCurrency(shipment.cost || 0)} will be returned to the user's credits.`)) {
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
      accessorKey: 'user.name',
      header: 'User',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.user.name}</div>
          <div className="text-gray-500">{row.original.user.email}</div>
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
          <Badge variant="secondary">Reseller</Badge>
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
          <Link href="/reseller" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Network Shipping Labels</h1>
          <Badge variant="secondary">Reseller</Badge>
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
            <CardTitle className="text-sm font-medium">Network Revenue</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalNetworkSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Total shipping spend
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
            <CardTitle className="text-sm font-medium">Network Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.networkSize}</div>
            <p className="text-xs text-muted-foreground">
              You + your users
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Labels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.keys(stats.labelsByStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status} ({stats.labelsByStatus[status]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Labels */}
      <Card>
        <CardHeader>
          <CardTitle>Network Shipping Labels</CardTitle>
          <CardDescription>
            Shipping labels created by you and your users. You can manage labels within your network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredShipments}
            searchPlaceholder="Search labels..."
          />
        </CardContent>
      </Card>

      {/* Status Distribution */}
      {Object.keys(stats.labelsByStatus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Label Status Overview</CardTitle>
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