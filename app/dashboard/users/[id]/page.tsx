"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    shipments: number;
  };
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view this user');
          } else {
            throw new Error('Failed to fetch user details');
          }
        }
        
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format role for display
  const formatRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'RESELLER':
        return 'Reseller';
      case 'USER':
        return 'User';
      default:
        return role;
    }
  };

  // Render role badge with appropriate styling
  const RoleBadge = ({ role }: { role: string }) => {
    let bgColor = '';
    
    switch (role) {
      case 'SUPER_ADMIN':
        bgColor = 'bg-purple-100 text-purple-800';
        break;
      case 'RESELLER':
        bgColor = 'bg-blue-100 text-blue-800';
        break;
      case 'USER':
        bgColor = 'bg-green-100 text-green-800';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${bgColor}`}>
        {formatRole(role)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading user details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <div className="mt-4">
          <Link
            href="/dashboard/users"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Return to Users List
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p className="font-bold">User Not Found</p>
        <p>The requested user could not be found.</p>
        <div className="mt-4">
          <Link
            href="/dashboard/users"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Return to Users List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Details</h1>
        <div className="flex space-x-2">
          <Link 
            href="/dashboard/users"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Back to Users
          </Link>
          <Link 
            href={`/dashboard/users/${params.id}/edit`}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          >
            Edit User
          </Link>
        </div>
      </div>
      
      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="mt-2">
                <RoleBadge role={user.role} />
                <span 
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                ${user.creditBalance.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Credit Balance</div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-800">Account Details</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Created On</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
            {user.creator && (
              <div>
                <p className="text-sm font-medium text-gray-600">Created By</p>
                <p className="mt-1 text-sm text-gray-900">
                  <Link 
                    href={`/dashboard/users/${user.creator.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {user.creator.name}
                  </Link>
                </p>
              </div>
            )}
            {user._count && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created Users</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {user._count.createdUsers > 0 ? (
                      <Link 
                        href={`/dashboard/users?creatorId=${user.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {user._count.createdUsers} user(s)
                      </Link>
                    ) : (
                      '0 users'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Shipments</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {user._count.shipments > 0 ? (
                      <Link 
                        href={`/dashboard/shipments?userId=${user.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {user._count.shipments} shipment(s)
                      </Link>
                    ) : (
                      '0 shipments'
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-800">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link 
              href={`/dashboard/users/${user.id}/edit`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Edit Profile
            </Link>
            <Link 
              href={`/dashboard/users/${user.id}/password`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Change Password
            </Link>
            <Link 
              href={`/dashboard/credits/assign?userId=${user.id}`}
              className="px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
            >
              Assign Credits
            </Link>
            <Link 
              href={`/dashboard/credits/transactions?userId=${user.id}`}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
            >
              View Transactions
            </Link>
            {(user.role === 'RESELLER' || user.role === 'SUPER_ADMIN') && (
              <Link 
                href={`/dashboard/users?creatorId=${user.id}`}
                className="px-4 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition"
              >
                Manage Users
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}