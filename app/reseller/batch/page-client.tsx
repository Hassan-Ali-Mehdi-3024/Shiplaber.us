'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Package, Users, AlertCircle, Activity, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BatchUploadForm from '@/components/batch/BatchUploadForm';
import BatchHistory from '@/components/batch/BatchHistory';

type Session = {
  id: string;
  role: string;
  name?: string;
  creditBalance?: number;
};

interface ResellerBatchClientProps {
  session: Session;
}

export default function ResellerBatchClient({ session }: ResellerBatchClientProps) {
  const [networkStats, setNetworkStats] = useState({
    networkCredits: 0,
    activeUsers: 0,
    totalBatches: 0,
    processingBatches: 0
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Fetch network statistics
  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        // This would typically come from an API endpoint
        // For now, using placeholder data
        setNetworkStats({
          networkCredits: (session.creditBalance || 0) * 1.2, // Estimate network total
          activeUsers: 5, // Placeholder
          totalBatches: 12, // Placeholder
          processingBatches: 2 // Placeholder
        });
      } catch (error) {
        console.error('Error fetching network stats:', error);
      }
    };

    fetchNetworkStats();
  }, [session.creditBalance]);

  const lowCreditWarning = (session.creditBalance || 0) < 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/reseller" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Network Batch Processing</h1>
          <Badge variant="secondary">Reseller</Badge>
        </div>
      </div>

      {/* Credit Balance Warning */}
      {lowCreditWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Low Credit Balance:</strong> You have {formatCurrency(session.creditBalance || 0)} remaining. 
            Your network batch processing may be limited. Consider adding more credits.
          </AlertDescription>
        </Alert>
      )}

      {/* Network Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Credits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowCreditWarning ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(networkStats.networkCredits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total available credits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users with batch access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.totalBatches}</div>
            <p className="text-xs text-muted-foreground">
              Network lifetime batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{networkStats.processingBatches}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Processing Tabs */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Create New Batch</TabsTrigger>
          <TabsTrigger value="network">Network Activity</TabsTrigger>
          <TabsTrigger value="management">Batch Management</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV for Network Batch Processing</CardTitle>
              <CardDescription>
                As a reseller, you can create batches for your business. These batches will use your credit balance 
                and will be visible to your users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchUploadForm />
            </CardContent>
          </Card>

          {/* Reseller-specific Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Reseller Batch Processing Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Credit Management</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Batches deduct from your reseller balance</li>
                      <li>• Ensure sufficient credits before processing</li>
                      <li>• Failed labels don't consume credits</li>
                      <li>• Monitor network credit usage</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Network Visibility</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Your batches are visible to your users</li>
                      <li>• Users can view processing status</li>
                      <li>• Track network-wide batch activity</li>
                      <li>• Generate network reports</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Batch Limits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Up to 2,000 labels per batch (reseller)</li>
                      <li>• Maximum 10MB file size</li>
                      <li>• Priority processing queue</li>
                      <li>• Enhanced error reporting</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Quality Control</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Pre-validation of all addresses</li>
                      <li>• Carrier rate optimization</li>
                      <li>• Detailed success/failure reports</li>
                      <li>• Automatic retry for failed labels</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Batch Activity</CardTitle>
              <CardDescription>
                View batch processing activity across your entire reseller network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchHistory />
            </CardContent>
          </Card>

          {/* Network Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Network Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">2.5min</div>
                  <div className="text-sm text-gray-600">Avg Processing Time</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1,245</div>
                  <div className="text-sm text-gray-600">Labels This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Management Tools</CardTitle>
              <CardDescription>
                Advanced tools for managing your network's batch processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* User Permissions */}
                <div>
                  <h4 className="font-semibold mb-3">User Batch Permissions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">All Network Users</div>
                        <div className="text-sm text-gray-600">Default batch processing permissions</div>
                      </div>
                      <Select defaultValue="enabled">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Processing Options */}
                <div>
                  <h4 className="font-semibold mb-3">Processing Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">Auto-retry Failed Labels</div>
                      <div className="text-sm text-gray-600 mb-3">
                        Automatically retry failed labels with corrected data
                      </div>
                      <Select defaultValue="enabled">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">Priority Processing</div>
                      <div className="text-sm text-gray-600 mb-3">
                        Process reseller batches with higher priority
                      </div>
                      <Select defaultValue="high">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="normal">Normal Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div>
                  <h4 className="font-semibold mb-3">Notification Settings</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Email notifications for batch completion</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Weekly batch processing reports</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Real-time failure alerts</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}