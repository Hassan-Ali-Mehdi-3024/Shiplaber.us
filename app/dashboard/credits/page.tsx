'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { CreditAssignmentForm } from '@/components/credits/credit-assignment-form';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  creatorId: string | null;
  creditBalance: number;
}

export default function CreditsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [session, setSession] = useState<{ id: string, role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

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
        
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine if current user can assign credits
  const canAssignCredits = session?.role === 'SUPER_ADMIN' || session?.role === 'RESELLER';

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Credit Management</h1>
        
        {canAssignCredits && (
          <Button onClick={() => setShowAssignForm(!showAssignForm)}>
            {showAssignForm ? 'Hide Form' : 'Assign Credits'}
          </Button>
        )}
      </div>

      {showAssignForm && session && (
        <CreditAssignmentForm 
          users={users} 
          sessionUserId={session.id}
          sessionUserRole={session.role}
          onSuccess={refreshData}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                  user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                  user.role === 'RESELLER' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-500">Balance:</span>
                <span className="text-lg font-bold">{formatCurrency(Number(user.creditBalance))}</span>
              </div>
              <Button 
                variant="outline"
                className="w-full mt-2"
                onClick={() => router.push(`/dashboard/credits/${user.id}`)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}