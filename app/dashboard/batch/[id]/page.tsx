"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Loader2,
  Check,
  XCircle,
  FileText,
  RefreshCw,
  ArrowLeft,
  Download,
  FileDown
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  Badge
} from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

interface Batch {
  id: string;
  filename: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  status: string;
  errorLog: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface Shipment {
  id: string;
  trackingNumber: string | null;
  labelUrl: string | null;
  status: string;
  cost: number;
  createdAt: string;
  toAddress: {
    name: string;
    city: string;
    state: string;
    country: string;
  };
  carrier: string | null;
  serviceLevel: string | null;
}

export default function BatchDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatch = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/labels/batch/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Not found",
            description: "This batch job doesn&apos;t exist or you don&apos;t have permission to view it",
            variant: "destructive",
          });
          router.push("/dashboard/batch");
          return;
        }
        
        throw new Error("Failed to fetch batch details");
      }
      
      const data = await response.json();
      setBatch(data.batch);
      setShipments(data.shipments || []);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load batch details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [params.id, router, toast]);

  useEffect(() => {
    fetchBatch();
    
    // Set up polling for in-progress batches
    const intervalId = setInterval(() => {
      if (batch?.status === 'PROCESSING' || batch?.status === 'PENDING') {
        fetchBatch();
      }
    }, 5000);
    
    // Clean up interval
    return () => clearInterval(intervalId);
  }, [params.id, batch?.status, fetchBatch]);

  const handleRefresh = () => {
    fetchBatch();
  };

  const handleGoBack = () => {
    router.push("/dashboard/batch");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-yellow-500">Processing</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const downloadErrorLog = () => {
    if (!batch?.errorLog) return;
    
    const blob = new Blob([batch.errorLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-log-${batch.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getShipmentStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading batch details...</span>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-6 bg-white rounded-lg shadow text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Batch Not Found</h2>
          <p className="text-muted-foreground mb-6">This batch job doesn&apos;t exist or you don&apos;t have permission to view it</p>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batches
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = batch.totalRows > 0 
    ? Math.round((batch.processedRows / batch.totalRows) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Batch Details</h1>
          {getStatusBadge(batch.status)}
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Batch Summary</CardTitle>
              <div className="text-sm text-muted-foreground">
                {new Date(batch.createdAt).toLocaleString()}
                <div>
                  {formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{batch.filename}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Batch ID: {batch.id}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Processing Progress</span>
                  <span className="text-sm font-medium">
                    {batch.processedRows} / {batch.totalRows} rows
                  </span>
                </div>
                <Progress value={progressPercentage} />
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-3 bg-muted rounded-md text-center">
                    <div className="text-lg font-bold">{batch.totalRows}</div>
                    <div className="text-xs text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="p-3 bg-green-50 text-green-700 rounded-md text-center">
                    <div className="text-lg font-bold">{batch.successfulRows}</div>
                    <div className="text-xs">Successful</div>
                  </div>
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-center">
                    <div className="text-lg font-bold">{batch.failedRows}</div>
                    <div className="text-xs">Failed</div>
                  </div>
                </div>
              </div>

              {batch.errorLog && (
                <div>
                  <Button variant="outline" size="sm" onClick={downloadErrorLog}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download Error Log
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
            <CardDescription>
              Showing {shipments.length} shipments from this batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <div className="text-center py-8 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">
                  {batch.status === 'PROCESSING' || batch.status === 'PENDING' 
                    ? 'Processing shipments... Please wait.' 
                    : 'No shipments found for this batch.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Label</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>
                          <div className="font-medium">{shipment.toAddress.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {shipment.toAddress.city}, {shipment.toAddress.state}, {shipment.toAddress.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          {shipment.carrier && shipment.serviceLevel ? (
                            <div>
                              <div>{shipment.carrier}</div>
                              <div className="text-xs text-muted-foreground">{shipment.serviceLevel}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shipment.trackingNumber || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getShipmentStatusBadge(shipment.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {shipment.labelUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Label
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">No label</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}