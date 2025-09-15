"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form schema with validation rules
const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ChangePasswordPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
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
            throw new Error('You do not have permission to change this user\'s password');
          } else {
            throw new Error('Failed to fetch user details');
          }
        }
        
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/users/${params.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: data.password }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }
      
      setSuccessMessage('Password changed successfully!');
      reset();
      
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
        <h1 className="text-2xl font-bold">Change Password</h1>
        <div className="flex space-x-2">
          <Link 
            href={`/dashboard/users/${params.id}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Back to User Details
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
        <div className="bg-white p-6 rounded shadow space-y-4">
          <div className="pb-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Changing Password for {user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-red-600 text-sm">{errors.password.message}</p>
              )}
            </div>
            
            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-4">
                <strong>Note:</strong> Passwords must be at least 8 characters long.
              </p>
              <div className="flex justify-end space-x-4">
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
                  {isSubmitting ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}