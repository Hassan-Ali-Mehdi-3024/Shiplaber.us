'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { CreditManagement } from '@/components/credits/credit-management';
import { TransactionHistory } from '@/components/credits/transaction-history';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  creditBalance: number;
  creatorId: string | null;
  creator?: {
    name: string;
    email: string;
  };
};

type SessionUser = {
  id: string;
  role: string;
};

export default function CreditManagementPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  // If userId is undefined, show error or redirect
  if (!userId) {
    console.error("userId parameter is missing");
    // Allow the rest of the component to load, it will show an error message
  }
  
  const [user, setUser] = useState<User | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch(`/api/users/${userId}`);
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        setUser(userData.user);

        // Fetch session data (current logged in user)
        const sessionResponse = await fetch('/api/auth/session');
        
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch session data');
        }
        
        const sessionData = await sessionResponse.json();
        setSessionUser({
          id: sessionData.user.id,
          role: sessionData.user.role,
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Handle credit update (called after successful credit assignment/revocation)
  const handleCreditUpdate = async () => {
    try {
      // Refresh user data after credit operation
      const userResponse = await fetch(`/api/users/${userId}`);
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch updated user data');
      }
      
      const userData = await userResponse.json();
      setUser(userData.user);
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
  };
  
  // Refresh function for manual reload
  const handleRefresh = () => {
    router.refresh();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-8 w-64" /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user || !sessionUser) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error || 'Failed to load user data'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if current user has permission to view this page
  const hasPermission = 
    sessionUser.id === userId || // Users can see their own page
    sessionUser.role === 'SUPER_ADMIN' || // Super admins can see all pages
    (sessionUser.role === 'RESELLER' && user.creatorId === sessionUser.id); // Resellers can see their created users

  if (!hasPermission) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Credit Management</CardTitle>
            <Badge variant={user.role === 'SUPER_ADMIN' ? 'destructive' : user.role === 'RESELLER' ? 'secondary' : 'outline'}>
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16" fallback={getInitials(user.name)} />
            <div>
              <h3 className="text-lg font-medium">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-1">
                <span className="font-bold">Current Balance:</span>{' '}
                <span className="text-lg font-bold">${Number(user.creditBalance).toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={handleRefresh} className="mt-2" variant="outline" size="sm">
              Refresh Balance
            </Button>
          </div>

          {user.creator && (
            <div className="mt-4 text-sm">
              <span className="text-muted-foreground">Account managed by:</span>{' '}
              <span>{user.creator.name} ({user.creator.email})</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CreditManagement
          userId={user.id}
          userName={user.name}
          currentBalance={Number(user.creditBalance)}
          userRole={user.role}
          sessionRole={sessionUser.role}
          onCreditUpdate={handleCreditUpdate}
        />
        <TransactionHistory userId={user.id} />
      </div>
    </div>
  );
}