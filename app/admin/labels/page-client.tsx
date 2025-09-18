import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, DollarSign, Clock, Search, Filter, Download, RefreshCw, Eye, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
};

type Shipment = {
  id: string;
  userId: string;
  shippoTransactionId: string | null;
  shippoObjectId: string | null;
  trackingNumber: string | null;
  labelUrl: string | null;
  cost: number | null;
  carrier: string | null;
  serviceLevel: string | null;
  fromAddress: string;
  toAddress: string;
  parcelDetails: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type LabelStats = {
  totalLabels: number;
  totalRevenue: number;
  recentLabels: number;
  labelsByStatus: Record<string, number>;
};

type Session = {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
};

type AdminLabelsClientProps = {
  shipments: Shipment[];
  users: User[];
  labelStats: LabelStats;
  session: Session;
};

'use client';

export default function AdminLabelsClient({ 
  shipments, 
  users, 
  labelStats, 
  session 
}: AdminLabelsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const { toast } = useToast();

  // Filter shipments based on search and filters
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = searchQuery === '' || 
      shipment.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    const matchesUser = userFilter === 'all' || shipment.userId === userFilter;
    const matchesCarrier = carrierFilter === 'all' || shipment.carrier === carrierFilter;
    
    return matchesSearch && matchesStatus && matchesUser && matchesCarrier;
  });

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

  const handleRefund = async (shipmentId: string) => {
    try {
      const response = await fetch('/api/labels/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipmentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refund label');
      }

      toast({
        title: "Label Refunded",
        description: "The shipping label has been successfully refunded.",
      });

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Refund Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleViewLabel = (labelUrl: string) => {
    if (labelUrl) {
      window.open(labelUrl, '_blank');
    }
  };

  const parseAddress = (addressJson: string) => {
    try {
      const address = JSON.parse(addressJson);
      return `${address.name}, ${address.street1}, ${address.city}, ${address.state} ${address.zip}`;
    } catch {
      return 'Invalid address data';
    }
  };

  const uniqueCarriers = Array.from(new Set(shipments.map(s => s.carrier).filter(Boolean))) as string[];

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

      <Tabs defaultValue="labels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="labels">All Labels</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="create">Create Label</TabsTrigger>
        </TabsList>

        <TabsContent value="labels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Labels</CardTitle>
              <CardDescription>Manage all shipping labels across the system</CardDescription>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tracking, user, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PURCHASED">Purchased</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    {uniqueCarriers.map((carrier) => (
                      <SelectItem key={carrier} value={carrier!}>
                        {carrier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
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
                      <TableHead>From/To</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{formatDate(new Date(shipment.createdAt))}</TableCell>
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
                            <div>
                              <p className="font-mono text-sm">{shipment.trackingNumber}</p>
                              <p className="text-xs text-gray-500">ID: {shipment.id.slice(0, 8)}...</p>
                            </div>
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
                          <div className="max-w-48">
                            <p className="text-xs truncate">{parseAddress(shipment.fromAddress)}</p>
                            <p className="text-xs text-gray-500 truncate">→ {parseAddress(shipment.toAddress)}</p>
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
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {shipment.labelUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLabel(shipment.labelUrl!)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {shipment.status === 'PURCHASED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRefund(shipment.id)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredShipments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No labels found matching your search criteria.
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
                <CardTitle>Labels by Status</CardTitle>
                <CardDescription>Distribution of label statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(labelStats.labelsByStatus).map(([status, count]) => (
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

            <Card>
              <CardHeader>
                <CardTitle>Top Carriers</CardTitle>
                <CardDescription>Most used shipping carriers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uniqueCarriers.slice(0, 5).map((carrier) => {
                    const count = shipments.filter(s => s.carrier === carrier).length;
                    return (
                      <div key={carrier} className="flex items-center justify-between">
                        <span className="font-medium">{carrier}</span>
                        <span className="text-gray-500">{count} labels</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Label for User</CardTitle>
              <CardDescription>Create a shipping label on behalf of any user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Label Creation Tool</h3>
                <p className="text-gray-600 mb-4">
                  This will integrate with the existing shipping label form to allow admins to create labels for any user.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Open Label Creator
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}