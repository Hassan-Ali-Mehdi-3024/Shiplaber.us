'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ShippingLabelForm } from '@/components/labels/shipping-label-form';

export default function CreateLabelPage() {
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the current session
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.user || !sessionData.user.id) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }
        
        // Fetch user credits
        const response = await fetch(`/api/credits/balance/${sessionData.user.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch credits balance');
        }
        
        setUserCredits(data.balance);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  return (
    <div className="container max-w-5xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Shipping Label</h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new shipping label
        </p>
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
      ) : (
        <div className="space-y-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Available Credits</CardTitle>
              <CardDescription>
                Your current credit balance for purchasing shipping labels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${userCredits?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
          
          {userCredits !== null && <ShippingLabelForm userCredits={userCredits} />}
        </div>
      )}
    </div>
  );
}