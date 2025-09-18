'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, DollarSign, Package, Calendar, BarChart3, PieChart, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type AnalyticsData = {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalShipments: number;
    recentShipments: number;
    totalRevenue: number;
    recentRevenue: number;
    totalTransactions: number;
    totalCreditsAssigned: number;
  };
  distributions: {
    shipmentsByStatus: Record<string, number>;
    carrierDistribution: Record<string, number>;
  };
  charts: {
    topDestinations: Array<{ destination: string; count: number }>;
    dailyActivity: any[];
    userGrowth: Array<{ date: Date; count: number }>;
  };
  managedUsers: Array<{
    id: string;
    name: string;
    creditBalance: number;
    isActive: boolean;
    createdAt: Date;
  }>;
};

type Session = {
  id: string;
  role: string;
  name?: string;
  creditBalance?: number;
};

interface ResellerAnalyticsClientProps {
  analyticsData: AnalyticsData;
  session: Session;
}

export default function ResellerAnalyticsClient({ analyticsData, session }: ResellerAnalyticsClientProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { overview, distributions, charts, managedUsers } = analyticsData;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 1000);
  };

  const handleExport = () => {
    // Create CSV export of analytics data
    const csvData = [
      ['Metric', 'Value'],
      ['Total Users', overview.totalUsers.toString()],
      ['Active Users', overview.activeUsers.toString()],
      ['Total Shipments', overview.totalShipments.toString()],
      ['Total Revenue', `$${overview.totalRevenue.toFixed(2)}`],
      ['Recent Shipments (7d)', overview.recentShipments.toString()],
      ['Recent Revenue (7d)', `$${overview.recentRevenue.toFixed(2)}`],
      ['Credits Assigned', `$${overview.totalCreditsAssigned.toFixed(2)}`],
    ];
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reseller-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/reseller" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Business Analytics</h1>
          <Badge variant="secondary">Reseller</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.totalShipments)}</div>
            <p className="text-xs text-muted-foreground">
              +{overview.recentShipments} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(overview.recentRevenue)} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Assigned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalCreditsAssigned)}</div>
            <p className="text-xs text-muted-foreground">
              To your users
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Shipment Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(distributions.shipmentsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{status}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(count / overview.totalShipments) * 100}%` 
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

            <Card>
              <CardHeader>
                <CardTitle>Business Metrics</CardTitle>
                <CardDescription>Key performance indicators for your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Revenue per User</span>
                    <span className="text-sm text-green-600">
                      {formatCurrency(overview.totalUsers > 0 ? overview.totalRevenue / overview.totalUsers : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Shipments per User</span>
                    <span className="text-sm text-gray-600">
                      {overview.totalUsers > 0 ? (overview.totalShipments / overview.totalUsers).toFixed(1) : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User Activation Rate</span>
                    <span className="text-sm text-green-600">
                      {overview.totalUsers > 0 ? ((overview.activeUsers / overview.totalUsers) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Credits Utilization</span>
                    <span className="text-sm text-blue-600">
                      {formatCurrency(overview.totalCreditsAssigned)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Overview</CardTitle>
              <CardDescription>Activity and performance of your managed users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {managedUsers.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">
                        Joined {formatDate(user.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(user.creditBalance)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Shipping Destinations</CardTitle>
              <CardDescription>Most popular destinations for your network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {charts.topDestinations.slice(0, 10).map((dest, index) => (
                  <div key={dest.destination} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium">{dest.destination}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(dest.count / (charts.topDestinations[0]?.count || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{dest.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Carrier Usage Distribution
              </CardTitle>
              <CardDescription>Shipping carrier preferences across your network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(distributions.carrierDistribution).map(([carrier, count]) => (
                  <div key={carrier} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{carrier}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(count / overview.totalShipments) * 100}%` 
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
        </TabsContent>
      </Tabs>
    </div>
  );
}