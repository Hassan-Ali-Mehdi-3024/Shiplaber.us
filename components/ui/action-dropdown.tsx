'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, CreditCard, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActionItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface ActionDropdownProps {
  actions: ActionItem[];
  label?: string;
}

export function ActionDropdown({ actions, label = "Actions" }: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              className={action.variant === 'destructive' ? 'text-red-600' : ''}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Predefined action sets for common use cases
export const getUserActions = (
  user: any,
  onEdit: (user: any) => void,
  onDelete: (user: any) => void,
  onManageCredits: (user: any) => void,
  onViewDetails: (user: any) => void
): ActionItem[] => [
  {
    label: 'View Details',
    icon: Eye,
    onClick: () => onViewDetails(user),
  },
  {
    label: 'Edit User',
    icon: Edit,
    onClick: () => onEdit(user),
  },
  {
    label: 'Manage Credits',
    icon: CreditCard,
    onClick: () => onManageCredits(user),
  },
  {
    label: 'Delete User',
    icon: Trash2,
    onClick: () => onDelete(user),
    variant: 'destructive',
  },
];

export const getLabelActions = (
  label: any,
  onView: (label: any) => void,
  onDownload: (label: any) => void,
  onRefund?: (label: any) => void
): ActionItem[] => {
  const actions: ActionItem[] = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: () => onView(label),
    },
    {
      label: 'Download',
      icon: Download,
      onClick: () => onDownload(label),
    },
  ];

  if (onRefund && label.status === 'PURCHASED') {
    actions.push({
      label: 'Process Refund',
      icon: Trash2,
      onClick: () => onRefund(label),
      variant: 'destructive',
    });
  }

  return actions;
};