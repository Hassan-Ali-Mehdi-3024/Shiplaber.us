'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, User, Mail, Calendar, DollarSign, Edit, MoreVertical, Settings, UserX, Trash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { UserForm } from '@/components/admin/user-form';
import { StatusBadge } from '@/components/ui/status-badge';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { ColumnDef } from '@tanstack/react-table';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
  isActive: boolean;
  createdAt: Date;
  _count: {
    shipments: number;
    sentTransactions: number;
  };
};

type Stats = {
  totalUsers: number;
  activeUsers: number;
  totalCreditsDistributed: number;
  totalLabels: number;
};

type Session = {
  id: string;
  role: string;
  name?: string;
  creditBalance?: number;
};

interface ResellerUsersClientProps {
  users: UserData[];
  stats: Stats;
  session: Session;
}

export default function ResellerUsersClient({ users, stats, session }: ResellerUsersClientProps) {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleCreateUser = async (userData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          role: 'USER', // Resellers can only create regular users
          creatorId: session.id
        })
      });

      if (response.ok) {
        setShowCreateUser(false);
        window.location.reload(); // Refresh to show new user
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create user'}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userData: any) => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setShowEditUser(false);
        setSelectedUser(null);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update user'}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete user'}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update user status'}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{row.original.name}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {row.original.email}
            </div>
          </div>
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
      accessorKey: '_count',
      header: 'Labels Created',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          {row.original._count.shipments}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionDropdown
          actions={[
            {
              label: 'Edit User',
              icon: Edit,
              onClick: () => {
                setSelectedUser(row.original);
                setShowEditUser(true);
              }
            },
            {
              label: row.original.isActive ? 'Deactivate' : 'Activate',
              icon: row.original.isActive ? UserX : Settings,
              onClick: () => handleToggleActive(row.original)
            },
            {
              label: 'Delete User',
              icon: Trash,
              onClick: () => {
                setSelectedUser(row.original);
                setShowDeleteConfirm(true);
              },
              variant: 'destructive'
            }
          ]}
        />
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
          <h1 className="text-2xl font-bold">My Users</h1>
          <Badge variant="secondary">Reseller</Badge>
        </div>
        
        <Button onClick={() => setShowCreateUser(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Distributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCreditsDistributed)}</div>
            <p className="text-xs text-muted-foreground">
              From your balance: {formatCurrency(session.creditBalance || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labels Created</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLabels}</div>
            <p className="text-xs text-muted-foreground">
              By your users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(session.creditBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users you have created. You can only create regular users and assign credits within your balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            searchPlaceholder="Search users..."
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      {showCreateUser && (
        <UserForm
          user={null}
          userRole={session.role}
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateUser(false)}
          isLoading={loading}
        />
      )}

      {/* Edit User Dialog */}
      {showEditUser && selectedUser && (
        <UserForm
          user={selectedUser}
          userRole={session.role}
          onSubmit={handleEditUser}
          onCancel={() => {
            setShowEditUser(false);
            setSelectedUser(null);
          }}
          isLoading={loading}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete User</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{selectedUser.name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedUser(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={loading}
                >
                  {loading && <span className="animate-spin mr-2">⏳</span>}
                  Delete User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}