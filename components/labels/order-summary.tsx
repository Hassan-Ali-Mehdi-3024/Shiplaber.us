'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AddressFormValues } from './address-form';
import { ParcelFormValues } from './parcel-form';
import { ShippingRate } from './shipping-rates';

interface OrderSummaryProps {
  fromAddress: AddressFormValues;
  toAddress: AddressFormValues;
  parcel: ParcelFormValues;
  selectedRate: ShippingRate;
  userCredits: number;
  onBack: () => void;
  onPurchase: () => void;
}

export function OrderSummary({
  fromAddress,
  toAddress,
  parcel,
  selectedRate,
  userCredits,
  onBack,
  onPurchase
}: OrderSummaryProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const rateAmount = parseFloat(selectedRate.amount);
  const hasSufficientFunds = userCredits >= rateAmount;
  
  const handlePurchase = async () => {
    if (!hasSufficientFunds) {
      setError('Insufficient credits. Please add more credits to your account.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // The actual purchase will be handled by the parent component
      onPurchase();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process order');
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Review your shipping details before purchase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">From Address</h3>
            <div className="text-sm space-y-1">
              <p>{fromAddress.name}</p>
              {fromAddress.company && <p>{fromAddress.company}</p>}
              <p>{fromAddress.street1}</p>
              {fromAddress.street2 && <p>{fromAddress.street2}</p>}
              <p>
                {fromAddress.city}, {fromAddress.state} {fromAddress.zip}
              </p>
              <p>{fromAddress.country}</p>
              {fromAddress.phone && <p>Phone: {fromAddress.phone}</p>}
              {fromAddress.email && <p>Email: {fromAddress.email}</p>}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">To Address</h3>
            <div className="text-sm space-y-1">
              <p>{toAddress.name}</p>
              {toAddress.company && <p>{toAddress.company}</p>}
              <p>{toAddress.street1}</p>
              {toAddress.street2 && <p>{toAddress.street2}</p>}
              <p>
                {toAddress.city}, {toAddress.state} {toAddress.zip}
              </p>
              <p>{toAddress.country}</p>
              {toAddress.phone && <p>Phone: {toAddress.phone}</p>}
              {toAddress.email && <p>Email: {toAddress.email}</p>}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-semibold mb-2">Package Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Dimensions</p>
              <p>
                {parcel.length} × {parcel.width} × {parcel.height} {parcel.distance_unit}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Weight</p>
              <p>
                {parcel.weight} {parcel.mass_unit}
              </p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-semibold mb-2">Shipping Method</h3>
          <div className="text-sm">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{selectedRate.provider}</p>
                <p className="text-gray-500">{selectedRate.servicelevel.name}</p>
                <p className="mt-1">
                  {selectedRate.days 
                    ? `${selectedRate.days} day${selectedRate.days > 1 ? 's' : ''}` 
                    : selectedRate.duration_terms}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-lg">
                  {formatCurrency(rateAmount, selectedRate.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold">Total</p>
            <p className="text-sm text-gray-500">
              Your current balance: {formatCurrency(userCredits)}
            </p>
          </div>
          <p className="font-bold text-xl">
            {formatCurrency(rateAmount, selectedRate.currency)}
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!hasSufficientFunds && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Insufficient Credits</AlertTitle>
            <AlertDescription>
              You don&apos;t have enough credits to purchase this shipping label.
              Please add more credits to your account.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button 
          onClick={handlePurchase} 
          disabled={isProcessing || !hasSufficientFunds}
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Purchase Label
        </Button>
      </CardFooter>
    </Card>
  );
}