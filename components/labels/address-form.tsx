'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

// Define schema for address validation
const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required').default('US'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  is_residential: z.boolean().optional().default(false),
  validation_results: z.any().optional(),
});

// Type for address form
export type AddressFormValues = z.infer<typeof addressSchema>;

// US states for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District Of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

// Countries for dropdown
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'MX', label: 'Mexico' }
];

interface AddressFormProps {
  title?: string;
  description?: string;
  defaultValues?: AddressFormValues;
  onSubmit?: (data: AddressFormValues, shippoAddressId?: string) => void;
  submitLabel?: string;
  canValidate?: boolean;
  type?: 'from' | 'to';
  address?: AddressFormValues;
  onChange?: (address: AddressFormValues) => void;
}

export function AddressForm({
  title,
  description,
  defaultValues,
  onSubmit,
  submitLabel = "Continue",
  canValidate = true,
  type,
  address,
  onChange
}: AddressFormProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [shippoAddressId, setShippoAddressId] = useState<string | null>(null);
  
  // Determine if we're using the shipping-label-form pattern or standalone pattern
  const isShippingLabelForm = type && address && onChange;

  // Set title based on the type if in shipping-label-form mode
  const formTitle = isShippingLabelForm 
    ? type === 'from' ? 'Sender Address' : 'Recipient Address'
    : title;
  
  // Initialize form with schema and default values
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address || defaultValues || {
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
      is_residential: type === 'to',
      validation_results: null
    },
    values: address // Keep form updated with external changes when in shipping-label-form mode
  });

  // Watch all fields to update parent component when values change
  useEffect(() => {
    if (isShippingLabelForm) {
      const subscription = form.watch((data) => {
        onChange?.(data as AddressFormValues);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, onChange, isShippingLabelForm]);

  // Validate address with GoShippo API
  const validateAddress = async (data: AddressFormValues) => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const response = await fetch('/api/labels/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate address');
      }
      
      setValidationResult(result.validation);
      
      if (result.validation.object_id) {
        setShippoAddressId(result.validation.object_id);
      }
      
      // If in shipping-label-form mode, update parent with validation results
      if (isShippingLabelForm && onChange) {
        onChange({
          ...data,
          validation_results: result.validation
        });
      }
      
      return result.validation;
    } catch (error) {
      console.error('Address validation error:', error);
      const errorResult = {
        validation_results: {
          is_valid: false,
          messages: [{ text: error instanceof Error ? error.message : 'Failed to validate address' }]
        }
      };
      setValidationResult(errorResult);
      
      // If in shipping-label-form mode, update parent with error results
      if (isShippingLabelForm && onChange) {
        onChange({
          ...data,
          validation_results: errorResult
        });
      }
      
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: AddressFormValues) => {
    if (isShippingLabelForm) {
      // In shipping-label-form mode, just validate and update parent
      if (canValidate) {
        await validateAddress(data);
      }
    } else if (onSubmit) {
      // In standalone mode, use the onSubmit callback
      if (canValidate && !shippoAddressId) {
        const validationResult = await validateAddress(data);
        // Always proceed with onSubmit, even if validation isn't perfect
        onSubmit(data, validationResult?.object_id);
      } else {
        onSubmit(data, shippoAddressId || undefined);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="street1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="street2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartment, Suite, etc. (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Province</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP / Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="94103" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {validationResult && (
              <Alert variant={validationResult.validation_results?.is_valid ? "default" : "destructive"}>
                {validationResult.validation_results?.is_valid ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Address Verified</AlertTitle>
                    <AlertDescription>
                      This address has been validated by our shipping partner.
                      {validationResult.validation_results?.is_valid_or_corrected && (
                        <Badge className="ml-2">Corrected</Badge>
                      )}
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Address Validation Issue</AlertTitle>
                    <AlertDescription>
                      {validationResult.validation_results?.messages?.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {validationResult.validation_results.messages.map((msg: any, i: number) => (
                            <li key={i}>{msg.text}</li>
                          ))}
                        </ul>
                      ) : (
                        "Unable to validate this address. Please check your information."
                      )}
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            {canValidate && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => validateAddress(form.getValues())}
                disabled={isValidating || !form.formState.isValid}
              >
                {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Validate Address
              </Button>
            )}
            
            <Button type="submit" disabled={canValidate && isValidating}>
              {submitLabel}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}