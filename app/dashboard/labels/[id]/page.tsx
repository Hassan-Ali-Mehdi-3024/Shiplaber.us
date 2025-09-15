'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Download, 
  Printer, 
  Copy, 
  ArrowLeft, 
  RefreshCcw,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ShipmentDetails {
  id: string;
  trackingNumber: string;
  labelUrl: string;
  status: string;
  created: string;
  total: number;
  fromAddress: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  toAddress: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  parcel: {
    length: number;
    width: number;
    height: number;
    distance_unit: string;
    weight: number;
    mass_unit: string;
  };
  serviceLevel: {
    name: string;
    provider: string;
    daysToDelivery?: number;
  };
}

export default function ShipmentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTrackingNumber, setCopiedTrackingNumber] = useState(false);
  const [refundStatus, setRefundStatus] = useState<'none' | 'processing' | 'success' | 'error'>('none');

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        // Get the current session
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.user || !sessionData.user.id) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }
        
        // Fetch shipment details
        const response = await fetch(`/api/labels/${params.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch shipment details');
        }
        
        setShipment(data.shipment);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShipment();
  }, [params.id]);

  const handleCopyTrackingNumber = () => {
    if (shipment?.trackingNumber) {
      navigator.clipboard.writeText(shipment.trackingNumber);
      setCopiedTrackingNumber(true);
      setTimeout(() => setCopiedTrackingNumber(false), 2000);
    }
  };

  const handleRefund = async () => {
    if (!shipment) return;
    
    setRefundStatus('processing');
    
    try {
      const response = await fetch(`/api/labels/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: shipment.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refund shipment');
      }
      
      setRefundStatus('success');
      
      // Refresh the shipment data after refund
      setTimeout(() => {
        router.refresh();
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setRefundStatus('error');
    }
  };

  const handleBack = () => {
    router.push('/dashboard/labels');
  };

  return (
    <div className="container max-w-5xl mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shipments
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Shipment Details</h1>
      </div>
      
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : shipment ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Label and Tracking Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Shipping Label</CardTitle>
                    <CardDescription>
                      Created on {formatDate(new Date(shipment.created))}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    shipment.status === 'REFUNDED' ? 'destructive' : 
                    shipment.status === 'CREATED' ? 'default' : 
                    'secondary'
                  }>
                    {shipment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Label Image */}
                <div className="mb-6 border rounded-md overflow-hidden bg-white">
                  {shipment.labelUrl ? (
                    <div className="relative w-full" style={{ height: '400px' }}>
                      <Image
                        src={shipment.labelUrl}
                        alt="Shipping Label"
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">Label image not available</p>
                    </div>
                  )}
                </div>
                
                {/* Tracking Number */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Tracking Number</h3>
                  <div className="flex items-center gap-2">
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      {shipment.trackingNumber}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyTrackingNumber}
                    >
                      {copiedTrackingNumber ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button asChild>
                  <a href={shipment.labelUrl} download target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center">
                      <Download className="mr-2 h-4 w-4" /> Download Label
                    </span>
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center">
                      <Printer className="mr-2 h-4 w-4" /> Print Label
                    </span>
                  </a>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Addresses */}
            <Card>
              <CardHeader>
                <CardTitle>Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* From Address */}
                  <div>
                    <h3 className="font-semibold mb-2">From</h3>
                    <div className="text-sm space-y-1">
                      <p>{shipment.fromAddress.name}</p>
                      {shipment.fromAddress.company && <p>{shipment.fromAddress.company}</p>}
                      <p>{shipment.fromAddress.street1}</p>
                      {shipment.fromAddress.street2 && <p>{shipment.fromAddress.street2}</p>}
                      <p>
                        {shipment.fromAddress.city}, {shipment.fromAddress.state} {shipment.fromAddress.zip}
                      </p>
                      <p>{shipment.fromAddress.country}</p>
                      {shipment.fromAddress.phone && <p>Phone: {shipment.fromAddress.phone}</p>}
                    </div>
                  </div>
                  
                  {/* To Address */}
                  <div>
                    <h3 className="font-semibold mb-2">To</h3>
                    <div className="text-sm space-y-1">
                      <p>{shipment.toAddress.name}</p>
                      {shipment.toAddress.company && <p>{shipment.toAddress.company}</p>}
                      <p>{shipment.toAddress.street1}</p>
                      {shipment.toAddress.street2 && <p>{shipment.toAddress.street2}</p>}
                      <p>
                        {shipment.toAddress.city}, {shipment.toAddress.state} {shipment.toAddress.zip}
                      </p>
                      <p>{shipment.toAddress.country}</p>
                      {shipment.toAddress.phone && <p>Phone: {shipment.toAddress.phone}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Shipment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Shipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm text-muted-foreground">Service</h3>
                  <p className="font-medium">{shipment.serviceLevel.provider}</p>
                  <p>{shipment.serviceLevel.name}</p>
                  {shipment.serviceLevel.daysToDelivery && (
                    <p className="text-sm">
                      Est. Delivery: {shipment.serviceLevel.daysToDelivery} days
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm text-muted-foreground">Package</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                    <div>
                      <p className="text-muted-foreground">Dimensions</p>
                      <p>
                        {shipment.parcel.length} × {shipment.parcel.width} × {shipment.parcel.height} {shipment.parcel.distance_unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Weight</p>
                      <p>
                        {shipment.parcel.weight} {shipment.parcel.mass_unit}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm text-muted-foreground">Cost</h3>
                  <p className="text-xl font-semibold mt-1">
                    {formatCurrency(shipment.total)}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                {shipment.status !== 'REFUNDED' && (
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleRefund}
                    disabled={refundStatus === 'processing' || refundStatus === 'success'}
                  >
                    {refundStatus === 'processing' ? (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : refundStatus === 'success' ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" /> Refunded Successfully
                      </>
                    ) : (
                      <>
                        Request Refund
                      </>
                    )}
                  </Button>
                )}
                
                {refundStatus === 'error' && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to process refund</AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Shipment Not Found</AlertTitle>
          <AlertDescription>
            The requested shipment could not be found.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}