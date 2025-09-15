'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Search, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  description: string;
  referenceId: string | null;
  createdAt: string;
  userId: string;
  createdById: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface TransactionsResponse {
  transactions: Transaction[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  error?: string;
}

const transactionTypes = [
  { value: 'ALL', label: 'All Types' },
  { value: 'CREDIT_ASSIGNED', label: 'Credit Assigned' },
  { value: 'CREDIT_REMOVED', label: 'Credit Removed' },
  { value: 'LABEL_PURCHASE', label: 'Label Purchase' },
  { value: 'LABEL_REFUND', label: 'Label Refund' }
];

export default function HistoryPage() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter state
  const [transactionType, setTransactionType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Load transactions
  const loadTransactions = async (page = currentPage) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (transactionType && transactionType !== 'ALL') {
        params.append('type', transactionType);
      }
      
      if (startDate) {
        params.append('startDate', startDate);
      }
      
      if (endDate) {
        params.append('endDate', endDate);
      }
      
      // Fetch transactions
      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data: TransactionsResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
      
      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  };
  
  // Load transactions on initial render
  useEffect(() => {
    loadTransactions(1);
  }, []);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadTransactions(page);
  };
  
  // Handle filter
  const handleFilter = () => {
    setIsFiltering(true);
    loadTransactions(1);
  };
  
  // Reset filters
  const resetFilters = () => {
    setTransactionType('ALL');
    setStartDate('');
    setEndDate('');
    setIsFiltering(true);
    loadTransactions(1);
  };
  
  // Export CSV
  const exportCsv = () => {
    // Convert transactions to CSV
    const headers = ['Date', 'Type', 'Description', 'Amount', 'User', 'Created By', 'Reference ID'];
    
    const csvRows = [
      headers.join(','),
      ...transactions.map(t => {
        return [
          formatDate(new Date(t.createdAt)),
          t.transactionType.replace('_', ' '),
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount.toFixed(2),
          `"${t.user.name} (${t.user.email})"`,
          `"${t.createdBy.name} (${t.createdBy.email})"`,
          t.referenceId || ''
        ].join(',');
      })
    ];
    
    // Create a Blob and download link
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Helper function to get transaction badge color
  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'CREDIT_ASSIGNED':
        return 'default';
      case 'CREDIT_REMOVED':
        return 'destructive';
      case 'LABEL_PURCHASE':
        return 'secondary';
      case 'LABEL_REFUND':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
  // Helper function to format transaction type for display
  const formatTransactionType = (type: string) => {
    return type.replace('_', ' ').split(' ').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground">
          View and filter your transaction history
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter transactions by type, date range, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select 
                value={transactionType} 
                onValueChange={setTransactionType}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 justify-end">
            <Button 
              variant="outline" 
              onClick={resetFilters}
              disabled={isFiltering || loading}
            >
              Reset
            </Button>
            
            <Button 
              onClick={handleFilter}
              disabled={isFiltering || loading}
            >
              {isFiltering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Your transaction history and credit movements
            </CardDescription>
          </div>
          
          {transactions.length > 0 && (
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
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
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {formatDate(new Date(transaction.createdAt))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTransactionBadgeVariant(transaction.transactionType)}>
                            {formatTransactionType(transaction.transactionType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <div>
                            <div>{transaction.user.name}</div>
                            <div className="text-xs text-muted-foreground">{transaction.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{transaction.createdBy.name}</div>
                            <div className="text-xs text-muted-foreground">{transaction.createdBy.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right ${
                          transaction.transactionType === 'CREDIT_ASSIGNED' || 
                          transaction.transactionType === 'LABEL_REFUND' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
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
                      
                      // Show limited page numbers for better UX
                      if (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
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
                      }
                      
                      // Show ellipsis for skipped pages
                      if (page === 2 || page === totalPages - 1) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <div className="px-4 py-2">...</div>
                          </PaginationItem>
                        );
                      }
                      
                      return null;
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}