'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BatchUploadForm from '@/components/batch/BatchUploadForm';
import BatchHistory from '@/components/batch/BatchHistory';

type Session = {
  id: string;
  role: string;
  name?: string;
  creditBalance?: number;
};

interface UserBatchClientProps {
  session: Session;
}

export default function UserBatchClient({ session }: UserBatchClientProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const lowCreditWarning = (session.creditBalance || 0) < 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/user" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Bulk Label Upload</h1>
          <Badge variant="secondary">User</Badge>
        </div>
      </div>

      {/* Credit Balance Warning */}
      {lowCreditWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Low Credit Balance:</strong> You have {formatCurrency(session.creditBalance || 0)} remaining. 
            Batch processing may fail if you don't have sufficient credits. Contact your reseller to add more credits.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowCreditWarning ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(session.creditBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for shipping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Limit</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,000</div>
            <p className="text-xs text-muted-foreground">
              Labels per batch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Size Limit</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5MB</div>
            <p className="text-xs text-muted-foreground">
              Maximum CSV file size
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Processing Tabs */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload New Batch</TabsTrigger>
          <TabsTrigger value="history">Batch History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV for Bulk Processing</CardTitle>
              <CardDescription>
                Upload a CSV file containing multiple shipping addresses to create labels in bulk. 
                Make sure you have sufficient credits before uploading.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchUploadForm />
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use Batch Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. Prepare Your CSV</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Download the CSV template</li>
                      <li>• Fill in all required fields</li>
                      <li>• Ensure addresses are complete</li>
                      <li>• Include package dimensions and weight</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">2. Upload and Process</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Upload your completed CSV file</li>
                      <li>• System validates all addresses</li>
                      <li>• Labels are created automatically</li>
                      <li>• Credits are deducted per label</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">3. Monitor Progress</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Track processing status</li>
                      <li>• View success/failure counts</li>
                      <li>• Download successful labels</li>
                      <li>• Review error reports</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">4. Get Results</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Download individual labels</li>
                      <li>• Export tracking numbers</li>
                      <li>• View batch summary</li>
                      <li>• Check transaction history</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Batch History</CardTitle>
              <CardDescription>
                View the status and results of your previous batch uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}