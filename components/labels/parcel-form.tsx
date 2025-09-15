'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define schema for parcel validation
const parcelSchema = z.object({
  length: z.coerce.number().positive('Length must be greater than zero'),
  width: z.coerce.number().positive('Width must be greater than zero'),
  height: z.coerce.number().positive('Height must be greater than zero'),
  distance_unit: z.enum(['in', 'cm']),
  weight: z.coerce.number().positive('Weight must be greater than zero'),
  mass_unit: z.enum(['lb', 'kg'])
});

// Type for parcel form
export type ParcelFormValues = z.infer<typeof parcelSchema>;

interface ParcelFormProps {
  defaultValues?: ParcelFormValues;
  onSubmit?: (data: ParcelFormValues) => void;
  submitLabel?: string;
  onBack?: () => void;
  parcel?: ParcelFormValues;
  onChange?: (parcel: ParcelFormValues) => void;
}

export function ParcelForm({
  defaultValues,
  onSubmit,
  submitLabel = "Continue",
  onBack,
  parcel,
  onChange
}: ParcelFormProps) {
  // Determine if we're using the shipping-label-form pattern or standalone pattern
  const isShippingLabelForm = parcel !== undefined && onChange !== undefined;

  // Initialize form with schema and default values
  const form = useForm<ParcelFormValues>({
    resolver: zodResolver(parcelSchema),
    defaultValues: parcel || defaultValues || {
      length: 12,
      width: 10,
      height: 8,
      distance_unit: 'in',
      weight: 1,
      mass_unit: 'lb'
    },
    values: parcel // Keep form updated with external changes when in shipping-label-form mode
  });
  
  // Watch form values to update parent component when values change
  useEffect(() => {
    if (isShippingLabelForm) {
      const subscription = form.watch((data) => {
        onChange?.(data as ParcelFormValues);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, onChange, isShippingLabelForm]);
  
  // Handle form submission
  const handleSubmit = (data: ParcelFormValues) => {
    if (isShippingLabelForm) {
      // In shipping-label-form mode, just update parent
      onChange?.(data);
    } else if (onSubmit) {
      // In standalone mode, use the onSubmit callback
      onSubmit(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Details</CardTitle>
        <CardDescription>Enter the dimensions and weight of your package</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Dimensions</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0.1" 
                          placeholder="12" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0.1" 
                          placeholder="10" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0.1" 
                          placeholder="8" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="distance_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measurement</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in">Inches (in)</SelectItem>
                        <SelectItem value="cm">Centimeters (cm)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Weight</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0.1" 
                          placeholder="1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mass_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measurement</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lb">Pounds (lb)</SelectItem>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button type="submit">{submitLabel}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}