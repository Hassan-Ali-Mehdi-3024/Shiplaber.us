'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';

type CreditManagementProps = {
  userId: string;
  userName: string;
  currentBalance: number;
  userRole: string;
  sessionRole: string;
  onCreditUpdate?: () => void;
}

export function CreditManagement({ userId, userName, currentBalance, userRole, sessionRole, onCreditUpdate }: CreditManagementProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assign');
  const { toast } = useToast();

  // Only Super Admins and Resellers can manage credits
  const canManageCredits = sessionRole === 'SUPER_ADMIN' || 
    (sessionRole === 'RESELLER' && userRole === 'USER');

  // Super Admins can assign credits to anyone
  // Resellers can only assign credits to their users
  const disableAssign = !canManageCredits;

  // Only allow revoking credits if the target account has a balance
  const disableRevoke = !canManageCredits || currentBalance <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const endpoint = activeTab === 'assign' ? '/api/credits/assign' : '/api/credits/revoke';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process credit operation');
      }

      // Show success message
      toast({
        title: activeTab === 'assign' ? "Credits Assigned" : "Credits Revoked",
        description: `${amount} credits ${activeTab === 'assign' ? 'assigned to' : 'revoked from'} ${userName}. New balance: ${data.creditBalance}`,
      });

      // Reset form
      setAmount('');
      setDescription('');
      
      // Update the displayed balance
      if (onCreditUpdate) {
        onCreditUpdate();
      } else {
        // Fall back to page reload if no callback provided
        setTimeout(() => window.location.reload(), 500);
      }

    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManageCredits) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Credits</CardTitle>
        <CardDescription>Current balance: {currentBalance} credits</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assign" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="assign" 
              disabled={disableAssign}
            >
              Assign Credits
            </TabsTrigger>
            <TabsTrigger 
              value="revoke" 
              disabled={disableRevoke}
            >
              Revoke Credits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign">
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Input
                  type="number"
                  placeholder="Amount to assign"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : "Assign Credits"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="revoke">
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Input
                  type="number"
                  placeholder="Amount to revoke"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  max={currentBalance.toString()}
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : "Revoke Credits"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}