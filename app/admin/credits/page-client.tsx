'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Users, TrendingUp, DollarSign, Calendar, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditManagement } from '@/components/credits/credit-management';
import { TransactionHistory } from '@/components/credits/transaction-history';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type Transaction = {
  id: string;
  userId: string;
  transactionType: string;
  amount: number;
  description: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type CreditStats = {
  totalCreditsInSystem: number;
  totalUsers: number;
  totalCreditTransactions: number;
};

type Session = {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
};

type AdminCreditsClientProps = {
  users: User[];
  recentTransactions: Transaction[];
  creditStats: CreditStats;
  session: Session;
};

export default function AdminCreditsClient({ 
  users, 
  recentTransactions, 
  creditStats, 
  session 
}: AdminCreditsClientProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleCreditUpdate = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

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

  const formatAmount = (type: string, amount: number) => {
    if (type === 'CREDIT_ASSIGN' || type === 'REFUND') {
      return `+$${amount.toFixed(2)}`;
    } else if (type === 'CREDIT_REVOKE' || type === 'LABEL_PURCHASE') {
      return `-$${amount.toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'destructive';
      case 'RESELLER':
        return 'default';
      case 'USER':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Credit Management (Admin)</h1>
      </div>

      {/* Credit Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits in System</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${creditStats.totalCreditsInSystem.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Available across all users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active user accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditStats.totalCreditTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Credit assignments & revocations
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User List */}
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Select a user to manage their credits</CardDescription>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="RESELLER">Reseller</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedUser?.id === user.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                            {user.creator && (
                              <span className="text-xs text-gray-500">
                                Created by {user.creator.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            ${user.creditBalance.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(new Date(user.createdAt))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Credit Management */}
            <div className="space-y-4">
              {selectedUser ? (
                <>
                  <CreditManagement
                    userId={selectedUser.id}
                    userName={selectedUser.name}
                    currentBalance={selectedUser.creditBalance}
                    userRole={selectedUser.role}
                    sessionRole={session.role}
                    onCreditUpdate={handleCreditUpdate}
                  />
                  <TransactionHistory userId={selectedUser.id} />
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Select a User</CardTitle>
                    <CardDescription>Choose a user from the list to manage their credits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-gray-500 py-8">
                      No user selected. Click on a user to view their credit information and manage their balance.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest {recentTransactions.length} credit-related transactions across all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(new Date(transaction.createdAt))}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.user.name}</p>
                            <p className="text-sm text-gray-600">{transaction.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTransactionTypeLabel(transaction.transactionType)}</TableCell>
                        <TableCell className={transaction.transactionType === 'CREDIT_ASSIGN' ? 'text-green-600' : transaction.transactionType === 'CREDIT_REVOKE' ? 'text-red-600' : ''}>
                          {formatAmount(transaction.transactionType, Number(transaction.amount))}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.createdBy.name}</p>
                            <Badge variant={getRoleBadgeColor(transaction.createdBy.role)} className="text-xs">
                              {transaction.createdBy.role}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Reports</CardTitle>
              <CardDescription>Generate and export credit-related reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Monthly Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  User Balances
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Transaction Summary
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <CreditCard className="h-6 w-6 mb-2" />
                  Credit Utilization
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  Revenue Analysis
                </Button>
                <Button variant="outline" className="h-20 flex-col" disabled>
                  <Search className="h-6 w-6 mb-2" />
                  Custom Query
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Report generation will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}