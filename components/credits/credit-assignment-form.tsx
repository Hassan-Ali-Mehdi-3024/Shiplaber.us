'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  creatorId: string | null;
  creditBalance: number;
}

type CreditAssignmentFormProps = {
  users: User[];
  sessionUserId: string;
  sessionUserRole: string;
  onSuccess?: () => void;
}

export function CreditAssignmentForm({ users, sessionUserId, sessionUserRole, onSuccess }: CreditAssignmentFormProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Filter users based on role
  // Super Admin can assign credits to anyone (except themselves)
  // Resellers can only assign to their users
  const eligibleUsers = users.filter(user => {
    if (user.id === sessionUserId) return false; // Can't assign credits to self
    
    if (sessionUserRole === 'SUPER_ADMIN') {
      return true; // Super admin can assign to anyone
    } else if (sessionUserRole === 'RESELLER') {
      return user.creatorId === sessionUserId && user.role === 'USER'; // Resellers only to their users
    }
    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      toast({
        title: "No user selected",
        description: "Please select a user to assign credits to",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/credits/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: parseFloat(amount),
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign credits');
      }

      toast({
        title: "Credits Assigned",
        description: `${amount} credits have been successfully assigned`,
      });

      // Reset form
      setSelectedUserId('');
      setAmount('');
      setDescription('');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to the user's credit management page
      router.push(`/dashboard/credits/${selectedUserId}`);
      
    } catch (error) {
      toast({
        title: "Failed to assign credits",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (eligibleUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assign Credits</CardTitle>
          <CardDescription>No eligible users found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>There are no eligible users to assign credits to. You may need to create users first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Credits</CardTitle>
        <CardDescription>Assign credits to users within your organization</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="user" className="block text-sm font-medium text-gray-700">
              Select User
            </label>
            <select
              id="user"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="" disabled>Select a user...</option>
              {eligibleUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - Current Balance: {Number(user.creditBalance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <Input
              id="description"
              placeholder="Reason for credit assignment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Assign Credits"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}