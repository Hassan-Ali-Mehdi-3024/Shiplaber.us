'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Card,
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { CustomButton } from '@/components/ui/custom-button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  created: string;
  toAddress: {
    name: string;
    city: string;
    state: string;
    country: string;
  };
  serviceLevel: {
    provider: string;
  };
  total: number;
}

interface ShipmentsResponse {
  shipments: Shipment[];
  totalCount: number;
  totalPages: number;
  error?: string;
}

export default function ShipmentListPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        // Get the current session
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.user || !sessionData.user.id) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }
        
        // Fetch shipments with pagination
        const response = await fetch(`/api/labels?page=${currentPage}&limit=10`);
        const data: ShipmentsResponse = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch shipments');
        }
        
        setShipments(data.shipments);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShipments();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Labels</h1>
          <p className="text-muted-foreground">
            View and manage your shipping labels
          </p>
        </div>
        <CustomButton href="/dashboard/labels/create">
          <span className="flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Create Label
          </span>
        </CustomButton>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Shipment History</CardTitle>
          <CardDescription>
            View all your past shipments and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven't created any shipping labels yet
              </p>
              <CustomButton href="/dashboard/labels/create">
                <span className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Label
                </span>
              </CustomButton>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>
                          {formatDate(new Date(shipment.created))}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {shipment.trackingNumber}
                        </TableCell>
                        <TableCell>
                          {shipment.toAddress.name}
                          <div className="text-xs text-muted-foreground">
                            {shipment.toAddress.city}, {shipment.toAddress.state}
                          </div>
                        </TableCell>
                        <TableCell>{shipment.serviceLevel.provider}</TableCell>
                        <TableCell>
                          <Badge variant={
                            shipment.status === 'REFUNDED' ? 'destructive' : 
                            shipment.status === 'CREATED' ? 'default' : 
                            'secondary'
                          }>
                            {shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(shipment.total)}
                        </TableCell>
                        <TableCell>
                          <CustomButton 
                            href={`/dashboard/labels/${shipment.id}`} 
                            variant="ghost" 
                            size="sm"
                          >
                            View
                          </CustomButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage - 1);
                            }} 
                          />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page);
                              }}
                              isActive={page === currentPage}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage + 1);
                            }} 
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}