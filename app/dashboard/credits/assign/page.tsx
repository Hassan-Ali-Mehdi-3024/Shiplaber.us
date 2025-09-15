'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { CreditAssignmentForm } from '@/components/credits/credit-assignment-form';

import { User as FormUser } from '@/components/credits/credit-assignment-form';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
  creatorId: string | null;
}

export default function CreditAssignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ id: string, role: string } | null>(null);
  const [users, setUsers] = useState<FormUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session data
        const sessionResponse = await fetch('/api/auth/session');
        
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch session');
        }
        
        const sessionData = await sessionResponse.json();
        setSession({
          id: sessionData.user.id,
          role: sessionData.user.role,
        });

        // Fetch users based on role
        const usersResponse = await fetch('/api/users');
        
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
        
        // If userId is provided, fetch specific user details
        if (userId) {
          const userResponse = await fetch(`/api/users/${userId}`);
          
          if (!userResponse.ok) {
            throw new Error('Failed to fetch user details');
          }
          
          const userData = await userResponse.json();
          setUser(userData.user);
        }
        
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleSuccess = () => {
    // If we're assigning to a specific user, navigate to their credit details page
    if (userId) {
      router.push(`/dashboard/credits/${userId}`);
    } else {
      // Otherwise go back to the credits management page
      router.push('/dashboard/credits');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error || 'Failed to load session data'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if current user has permission to assign credits
  const canAssignCredits = session.role === 'SUPER_ADMIN' || session.role === 'RESELLER';

  if (!canAssignCredits) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to assign credits.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assign Credits</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Assigning Credits to {user.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
              <p><span className="font-medium">Current Balance:</span> {formatCurrency(Number(user.creditBalance))}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <CreditAssignmentForm 
        users={users} 
        sessionUserId={session.id}
        sessionUserRole={session.role}
        onSuccess={handleSuccess}
      />
    </div>
  );
}