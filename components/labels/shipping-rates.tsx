'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface ShippingRate {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
    terms: string;
  };
  days: number;
  duration_terms: string;
}

interface ShippingRatesProps {
  rates: ShippingRate[];
  onSelect?: (rate: ShippingRate) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function ShippingRates({ rates, onSelect, onBack, isLoading = false }: ShippingRatesProps) {
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  
  const handleContinue = () => {
    const selectedRate = rates.find(rate => rate.object_id === selectedRateId);
    if (selectedRate && onSelect) {
      onSelect(selectedRate);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calculating Shipping Rates</CardTitle>
          <CardDescription>Please wait while we calculate the best shipping options</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4">This may take a few moments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Shipping Options Available</CardTitle>
          <CardDescription>We couldn't find any shipping options for this route</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-6">
            Please check the addresses and package details, or try a different shipping route.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={onBack} className="w-full">Go Back</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Shipping Method</CardTitle>
        <CardDescription>Choose the shipping option that best suits your needs</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedRateId} onValueChange={setSelectedRateId}>
          <div className="space-y-3">
            {rates.map((rate) => (
              <div
                key={rate.object_id}
                className={`
                  border rounded-lg p-4 cursor-pointer 
                  ${selectedRateId === rate.object_id ? 'border-primary bg-primary/5' : 'border-gray-200'}
                `}
                onClick={() => setSelectedRateId(rate.object_id)}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value={rate.object_id} id={rate.object_id} className="mt-1" />
                  <Label htmlFor={rate.object_id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{rate.provider}</div>
                        <div className="text-sm text-gray-500">{rate.servicelevel.name}</div>
                        <div className="text-sm mt-1">
                          {rate.days ? `${rate.days} day${rate.days > 1 ? 's' : ''}` : rate.duration_terms}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg">
                          {formatCurrency(parseFloat(rate.amount), rate.currency)}
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedRateId}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}