'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

type Transaction = {
  id: string;
  userId: string;
  transactionType: string;
  amount: number;
  description: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type TransactionHistoryProps = {
  userId: string;
}

export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`/api/transactions/${userId}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data.transactions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [userId]);

  // Helper to get readable transaction type
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'CREDIT_ASSIGN':
        return 'Credit Added';
      case 'CREDIT_REVOKE':
        return 'Credit Removed';
      case 'LABEL_PURCHASE':
        return 'Label Purchase';
      default:
        return type.replace('_', ' ').toLowerCase();
    }
  };

  // Helper to format transaction amount with sign
  const formatAmount = (type: string, amount: number) => {
    if (type === 'CREDIT_ASSIGN' || type === 'REFUND') {
      return `+$${amount.toFixed(2)}`;
    } else if (type === 'CREDIT_REVOKE' || type === 'LABEL_PURCHASE') {
      return `-$${amount.toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Loading transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription className="text-red-500">Error loading transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          {transactions.length ? `${transactions.length} transactions found` : 'No transactions found'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(new Date(transaction.createdAt))}</TableCell>
                    <TableCell>{getTransactionTypeLabel(transaction.transactionType)}</TableCell>
                    <TableCell className={transaction.transactionType === 'CREDIT_ASSIGN' ? 'text-green-600' : transaction.transactionType === 'CREDIT_REVOKE' ? 'text-red-600' : ''}>
                      {formatAmount(transaction.transactionType, Number(transaction.amount))}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.createdBy.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">No transactions found for this user</p>
        )}
      </CardContent>
    </Card>
  );
}