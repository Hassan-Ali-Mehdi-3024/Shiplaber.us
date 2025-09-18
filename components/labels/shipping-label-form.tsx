'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, ChevronRight } from 'lucide-react';

import { AddressForm, AddressFormValues } from './address-form';
import { ParcelForm, ParcelFormValues } from './parcel-form';
import { ShippingRates, ShippingRate } from './shipping-rates';
import { OrderSummary } from './order-summary';

// Default values for the forms
const defaultFromAddress: AddressFormValues = {
  name: '',
  company: '',
  street1: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
  email: '',
  is_residential: false,
  validation_results: null,
};

const defaultToAddress: AddressFormValues = {
  name: '',
  company: '',
  street1: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
  email: '',
  is_residential: true,
  validation_results: null,
};

const defaultParcel: ParcelFormValues = {
  length: 12,
  width: 10,
  height: 8,
  distance_unit: 'in',
  weight: 1,
  mass_unit: 'lb',
};

type Step = 'addresses' | 'package' | 'rates' | 'summary';

interface ShippingLabelFormProps {
  userCredits: number;
  onSuccess?: () => void;
}

export function ShippingLabelForm({ userCredits, onSuccess }: ShippingLabelFormProps) {
  const router = useRouter();
  
  // Form state
  const [fromAddress, setFromAddress] = useState<AddressFormValues>(defaultFromAddress);
  const [toAddress, setToAddress] = useState<AddressFormValues>(defaultToAddress);
  const [parcel, setParcel] = useState<ParcelFormValues>(defaultParcel);
  
  // UI state
  const [currentStep, setCurrentStep] = useState<Step>('addresses');
  const [addressesValid, setAddressesValid] = useState(false);
  const [parcelValid, setParcelValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Rates state
  const [availableRates, setAvailableRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  
  // Validation functions
  const validateAddresses = async (skipValidation = false) => {
    setError(null);
    setIsLoading(true);
    
    // If skipValidation is true, just move to the next step without actual validation
    if (skipValidation) {
      setAddressesValid(true);
      setCurrentStep('package');
      setIsLoading(false);
      return;
    }
    
    try {
      // Validate from address
      const fromResponse = await fetch('/api/labels/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fromAddress),
      });
      
      const fromData = await fromResponse.json();
      if (!fromResponse.ok) {
        throw new Error(fromData.error || 'Failed to validate sender address');
      }
      
      // Validate to address
      const toResponse = await fetch('/api/labels/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toAddress),
      });
      
      const toData = await toResponse.json();
      if (!toResponse.ok) {
        throw new Error(toData.error || 'Failed to validate recipient address');
      }
      
      // Update addresses with validation results
      setFromAddress({
        ...fromAddress,
        validation_results: fromData.validation,
      });
      
      setToAddress({
        ...toAddress,
        validation_results: toData.validation,
      });
      
      setAddressesValid(true);
      setCurrentStep('package');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate addresses');
      setAddressesValid(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getShippingRates = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/labels/get-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress,
          toAddress,
          parcel,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get shipping rates');
      }
      
      setAvailableRates(data.rates || []);
      setCurrentStep('rates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get shipping rates');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRateSelect = (rate: ShippingRate) => {
    setSelectedRate(rate);
    setCurrentStep('summary');
  };
  
  const purchaseLabel = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (!selectedRate) {
        throw new Error('No shipping rate selected');
      }
      
      const response = await fetch('/api/labels/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress,
          toAddress,
          parcel,
          rateId: selectedRate.object_id,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase shipping label');
      }
      
      // Handle success
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/labels/${data.shipment.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase label');
      setIsLoading(false);
    }
  };
  
  // Helper functions for navigation
  const goToAddresses = () => setCurrentStep('addresses');
  const goToPackage = () => {
    if (addressesValid) setCurrentStep('package');
    else validateAddresses();
  };
  const goToRates = () => {
    if (parcelValid) getShippingRates();
    else setError('Please complete the package details');
  };
  const goToSummary = () => {
    if (selectedRate) setCurrentStep('summary');
    else setError('Please select a shipping rate');
  };
  
  // Determine which tab to show as active
  const activeTab = 
    currentStep === 'addresses' ? 'addresses' :
    currentStep === 'package' ? 'package' :
    currentStep === 'rates' ? 'rates' :
    'summary';
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="addresses" disabled={isLoading}>
            Addresses
          </TabsTrigger>
          <TabsTrigger value="package" disabled={!addressesValid || isLoading}>
            Package
          </TabsTrigger>
          <TabsTrigger value="rates" disabled={!parcelValid || isLoading}>
            Shipping Rates
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={!selectedRate || isLoading}>
            Summary
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="addresses">
          <Card className="p-6">
            <AddressForm
              type="from"
              address={fromAddress}
              onChange={setFromAddress}
            />
            
            <div className="h-8" />
            
            <AddressForm
              type="to"
              address={toAddress}
              onChange={setToAddress}
            />
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => validateAddresses(true)} 
                disabled={isLoading}
                title="Skip address validation and proceed"
              >
                Skip Validation
              </Button>
              <Button onClick={() => validateAddresses(false)} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Validate & Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="package">
          <Card className="p-6">
            <ParcelForm
              parcel={parcel}
              onChange={(newParcel) => {
                setParcel(newParcel);
                setParcelValid(
                  !!newParcel.length &&
                  !!newParcel.width &&
                  !!newParcel.height &&
                  !!newParcel.weight
                );
              }}
            />
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToAddresses} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={goToRates} disabled={!parcelValid || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Rates
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="rates">
          <Card className="p-6">
            <ShippingRates
              rates={availableRates}
              onSelect={handleRateSelect}
            />
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPackage} disabled={isLoading}>
                Back
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary">
          {selectedRate && (
            <OrderSummary
              fromAddress={fromAddress}
              toAddress={toAddress}
              parcel={parcel}
              selectedRate={selectedRate}
              userCredits={userCredits}
              onBack={() => setCurrentStep('rates')}
              onPurchase={purchaseLabel}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}