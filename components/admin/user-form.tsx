'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "RESELLER", "USER"], {
    required_error: "Please select a role",
  }),
  creditBalance: z.number().min(0, "Credit balance must be a positive number").optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    creditBalance: number;
  } | null;
  userRole: string; // Current logged-in user's role
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function UserForm({ user, userRole, onSubmit, onCancel, isLoading = false }: UserFormProps) {
  const { toast } = useToast();
  const isEditing = !!user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: (user?.role as "SUPER_ADMIN" | "ADMIN" | "RESELLER" | "USER") || 'USER',
      creditBalance: user?.creditBalance || 0,
    },
  });

  const handleSubmit = async (data: UserFormData) => {
    try {
      // If editing, don't send password if it's empty
      if (isEditing && !data.password) {
        delete data.password;
      }
      
      await onSubmit(data);
      
      if (!isEditing) {
        form.reset();
      }
      
      toast({
        title: isEditing ? "User updated successfully" : "User created successfully",
        description: `${data.name} has been ${isEditing ? 'updated' : 'created'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} user`,
        variant: "destructive",
      });
    }
  };

  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return [
        { value: 'SUPER_ADMIN', label: 'Super Admin' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'RESELLER', label: 'Reseller' },
        { value: 'USER', label: 'User' },
      ];
    } else if (userRole === 'RESELLER') {
      return [
        { value: 'USER', label: 'User' },
      ];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit User' : 'Create New User'}</CardTitle>
        <CardDescription>
          {isEditing 
            ? `Update information for ${user?.name}`
            : 'Enter the details for the new user'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter full name" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter email address" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password {isEditing && <span className="text-sm text-gray-500">(leave blank to keep current)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
              <FormField
                control={form.control}
                name="creditBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Credit Balance (USD)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}