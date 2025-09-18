'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Plus, MoreHorizontal, Edit, Trash2, CreditCard, Users, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { ActionDropdown, getUserActions } from '@/components/ui/action-dropdown';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserForm } from '@/components/admin/user-form';
import { CreditManagement } from '@/components/credits/credit-management';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
  isActive: boolean;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    createdUsers: number;
  };
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  
  const [session, setSession] = useState<any>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResellers: 0,
    totalCredits: 0,
    activeUsers: 0,
  });

  // Fetch session
  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        console.log('Session response:', data); // Debug log
        setSession(data.user); // Extract user from response
      } else {
        console.log('No session found or unauthorized');
        setSession(null);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setSession(null);
    } finally {
      setSessionLoaded(true);
    }
  };

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
      
      // Calculate stats
      const totalUsers = data.users.filter((u: User) => u.role === 'USER').length;
      const totalResellers = data.users.filter((u: User) => u.role === 'RESELLER').length;
      const totalCredits = data.users.reduce((sum: number, u: User) => sum + u.creditBalance, 0);
      const activeUsers = data.users.filter((u: User) => u.isActive).length;
      
      setStats({ totalUsers, totalResellers, totalCredits, activeUsers });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchUsers();
  }, []);

  // Handle user creation
  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      
      await fetchUsers();
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      throw error; // Let UserForm handle the error display
    }
  };

  // Handle user editing
  const handleEditUser = async (userData: any) => {
    try {
      const response = await fetch(`/api/users/${selectedUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      
      await fetchUsers();
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      throw error;
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      
      toast({
        title: "User deleted",
        description: `${user.name} has been deleted successfully.`,
      });
      
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // Table columns definition
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
          <span className="text-sm text-gray-500">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <StatusBadge status={row.getValue("role")} variant="role" />
      ),
    },
    {
      accessorKey: "creditBalance",
      header: "Credits",
      cell: ({ row }) => (
        <span className="font-medium">${row.getValue<number>("creditBalance").toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.getValue("isActive") ? "Active" : "Inactive"} />
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "_count.createdUsers",
      header: "Managed Users",
      cell: ({ row }) => {
        const count = row.original._count?.createdUsers || 0;
        return row.original.role === 'RESELLER' ? count : '-';
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        
        const actions = getUserActions(
          user,
          (user) => { setSelectedUser(user); setIsEditDialogOpen(true); },
          (user) => handleDeleteUser(user),
          (user) => { setSelectedUser(user); setIsCreditDialogOpen(true); },
          (user) => { setSelectedUser(user); setIsDetailsDialogOpen(true); }
        );
        
        return <ActionDropdown actions={actions} />;
      },
    },
  ];

  // Show loading while session is being fetched
  if (!sessionLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Check if user has admin access
  if (!session || (!session.role || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN'))) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Access denied. Admin role required.</p>
          <p className="text-xs text-gray-400">Current role: {session?.role || 'Not logged in'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage all users, resellers, and administrators</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resellers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResellers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCredits.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage all users in the system. You can create, edit, delete users and manage their credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            searchPlaceholder="Search users..."
            searchKey="name"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with appropriate role and permissions.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            userRole={session.role}
            onSubmit={handleCreateUser}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              userRole={session.role}
              onSubmit={handleEditUser}
              onCancel={() => { setIsEditDialogOpen(false); setSelectedUser(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <StatusBadge status={selectedUser.role} variant="role" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Credit Balance</label>
                  <p className="text-sm font-medium">${selectedUser.creditBalance.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <StatusBadge status={selectedUser.isActive ? "Active" : "Inactive"} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {selectedUser.creator && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-sm">{selectedUser.creator.name} ({selectedUser.creator.email})</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit Management Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Credits</DialogTitle>
            <DialogDescription>
              Assign or revoke credits for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <CreditManagement
              userId={selectedUser.id}
              userName={selectedUser.name}
              currentBalance={selectedUser.creditBalance}
              userRole={selectedUser.role}
              sessionRole={session.role}
              onCreditUpdate={() => {
                fetchUsers();
                setIsCreditDialogOpen(false);
                setSelectedUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}