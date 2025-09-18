'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, DollarSign, Users, TrendingUp, CreditCard, Edit, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnDef } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  creditBalance: number;
  isActive: boolean;
  createdAt: Date;
};

type CreditTransaction = {
  id: string;
  userId: string;
  transactionType: string;
  amount: number;
  description: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
  createdBy: {
    name: string;
  };
};

type CreditData = {
  managedUsers: ManagedUser[];
  creditTransactions: CreditTransaction[];
  stats: {
    totalAssigned: number;
    activeUsers: number;
    availableBalance: number;
    totalUsers: number;
  };
};

type Session = {
  id: string;
  role: string;
  name?: string;
  creditBalance?: number;
};

interface ResellerCreditsClientProps {
  creditData: CreditData;
  session: Session;
}

export default function ResellerCreditsClient({ creditData, session }: ResellerCreditsClientProps) {
  const [showAssignCredit, setShowAssignCredit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [actionType, setActionType] = useState<'assign' | 'revoke'>('assign');
  const [loading, setLoading] = useState(false);

  const { managedUsers, creditTransactions, stats } = creditData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleCreditAction = async () => {
    if (!selectedUser || !creditAmount) return;
    
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid credit amount');
      return;
    }

    if (actionType === 'assign' && amount > stats.availableBalance) {
      alert('Insufficient balance. You can only assign credits within your available balance.');
      return;
    }

    if (actionType === 'revoke' && amount > selectedUser.creditBalance) {
      alert(`Cannot revoke more credits than user has (${formatCurrency(selectedUser.creditBalance)})`);
      return;
    }

    setLoading(true);
    try {
      const endpoint = actionType === 'assign' ? '/api/credits/assign' : '/api/credits/revoke';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: amount,
          description: creditDescription || `Credit ${actionType} by reseller`
        })
      });

      if (response.ok) {
        setShowAssignCredit(false);
        setSelectedUser(null);
        setCreditAmount('');
        setCreditDescription('');
        window.location.reload(); // Refresh to show updated data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || `Failed to ${actionType} credits`}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const userColumns: ColumnDef<ManagedUser>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.original.name}</div>
          <div className="text-sm text-gray-500">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'creditBalance',
      header: 'Credit Balance',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-green-600">
          {formatCurrency(row.original.creditBalance)}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.isActive ? 'active' : 'inactive'}
          variant="default"
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(row.original);
              setActionType('assign');
              setShowAssignCredit(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Assign
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(row.original);
              setActionType('revoke');
              setShowAssignCredit(true);
            }}
            disabled={row.original.creditBalance <= 0}
          >
            <Minus className="h-3 w-3 mr-1" />
            Revoke
          </Button>
        </div>
      ),
    },
  ];

  const transactionColumns: ColumnDef<CreditTransaction>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      accessorKey: 'user.name',
      header: 'User',
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.original.user.name}</div>
          <div className="text-sm text-gray-500">{row.original.user.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.transactionType.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className={`text-sm font-medium ${
          row.original.transactionType === 'CREDIT_ASSIGN' 
            ? 'text-green-600' 
            : 'text-red-600'
        }`}>
          {row.original.transactionType === 'CREDIT_ASSIGN' ? '+' : '-'}
          {formatCurrency(row.original.amount)}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {row.original.description || 'No description'}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/reseller" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Credit Management</h1>
          <Badge variant="secondary">Reseller</Badge>
        </div>
      </div>

      {/* Credit Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.availableBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Ready to assign
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Assigned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAssigned)}</div>
            <p className="text-xs text-muted-foreground">
              To {stats.totalUsers} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Out of {stats.totalUsers} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Pool</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.availableBalance + stats.totalAssigned)}</div>
            <p className="text-xs text-muted-foreground">
              Available + Assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Credit Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Credit Balances</CardTitle>
          <CardDescription>
            Assign or revoke credits for your users. You can only assign credits within your available balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={managedUsers}
            searchPlaceholder="Search users..."
          />
        </CardContent>
      </Card>

      {/* Credit Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Transaction History</CardTitle>
          <CardDescription>
            Recent credit assignments and revocations for your users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={transactionColumns}
            data={creditTransactions}
            searchPlaceholder="Search transactions..."
          />
        </CardContent>
      </Card>

      {/* Credit Assignment/Revocation Modal */}
      {showAssignCredit && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {actionType === 'assign' ? 'Assign Credits' : 'Revoke Credits'} - {selectedUser.name}
              </CardTitle>
              <CardDescription>
                {actionType === 'assign' 
                  ? `Available balance: ${formatCurrency(stats.availableBalance)}`
                  : `User balance: ${formatCurrency(selectedUser.creditBalance)}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Reason for credit action..."
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignCredit(false);
                    setSelectedUser(null);
                    setCreditAmount('');
                    setCreditDescription('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreditAction}
                  disabled={loading || !creditAmount}
                  className={actionType === 'assign' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {loading && <span className="animate-spin mr-2">⏳</span>}
                  {actionType === 'assign' ? 'Assign Credits' : 'Revoke Credits'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}