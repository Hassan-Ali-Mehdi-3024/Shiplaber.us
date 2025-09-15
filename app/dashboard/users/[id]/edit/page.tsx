"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form schema with validation rules
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["SUPER_ADMIN", "RESELLER", "USER"], {
    invalid_type_error: "Please select a valid role",
  }),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
  isActive: boolean;
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      role: 'USER',
      isActive: true
    }
  });

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to edit this user');
          } else {
            throw new Error('Failed to fetch user details');
          }
        }
        
        const data = await response.json();
        setUser(data);
        
        // Set form defaults from user data
        reset({
          name: data.name,
          role: data.role,
          isActive: data.isActive
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }
      
      setSuccessMessage('User updated successfully!');
      setUser({
        ...user!,
        ...result
      });
      
      // Redirect back to user details after brief delay
      setTimeout(() => {
        router.push(`/dashboard/users/${params.id}`);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading user details...</div>
      </div>
    );
  }

  if (error && !user) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <div className="flex space-x-2">
          <Link 
            href={`/dashboard/users/${params.id}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Back to User Details
          </Link>
          <Link 
            href="/dashboard/users"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            All Users
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {user && (
        <>
          <div className="bg-white p-6 rounded shadow space-y-4">
            {/* User Information Summary */}
            <div className="flex justify-between pb-4 border-b">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ${user.creditBalance.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Credit Balance</div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm">{errors.name.message}</p>
                )}
              </div>
              
              {/* Role Field */}
              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="RESELLER">Reseller</option>
                  <option value="USER">User</option>
                </select>
                {errors.role && (
                  <p className="text-red-600 text-sm">{errors.role.message}</p>
                )}
              </div>
              
              {/* Active Status */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    type="checkbox"
                    {...register('isActive')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    User is active
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Inactive users cannot log in or perform any actions in the system.
                </p>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Link
                  href={`/dashboard/users/${params.id}`}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
            
            {/* Quick Links */}
            <div className="pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Other Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Link 
                  href={`/dashboard/users/${user.id}/password`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change User Password
                </Link>
                <span className="text-gray-300 mx-1">|</span>
                <Link 
                  href={`/dashboard/credits/assign?userId=${user.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Assign Credits
                </Link>
                <span className="text-gray-300 mx-1">|</span>
                <Link 
                  href={`/dashboard/credits/transactions?userId=${user.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Transaction History
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}