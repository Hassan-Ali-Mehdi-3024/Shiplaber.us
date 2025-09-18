'use client';

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'role' | 'transaction' | 'shipment';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    if (variant === 'role') {
      switch (status) {
        case 'SUPER_ADMIN':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'ADMIN':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'RESELLER':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'USER':
          return 'bg-green-100 text-green-800 border-green-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }

    if (variant === 'transaction') {
      switch (status) {
        case 'CREDIT_ASSIGN':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'CREDIT_REVOKE':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'LABEL_PURCHASE':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'LABEL_REFUND':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }

    if (variant === 'shipment') {
      switch (status) {
        case 'PURCHASED':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'REFUNDED':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'DELIVERED':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'IN_TRANSIT':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'CANCELLED':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }

    // Default variant
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Badge 
      variant="outline" 
      className={`px-2 py-1 text-xs font-medium ${getStatusStyles()}`}
    >
      {formatStatus(status)}
    </Badge>
  );
}