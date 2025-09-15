"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Eye,
  Loader2
} from "lucide-react";
import { 
  Badge
} from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface Batch {
  id: string;
  filename: string;
  status: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  createdAt: string;
  completedAt: string | null;
}

export default function BatchHistory() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch("/api/labels/batch");
        
        if (!response.ok) {
          throw new Error("Failed to fetch batch history");
        }
        
        const data = await response.json();
        setBatches(data.batches);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load batch history",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
    
    // Set up polling for active batches
    const intervalId = setInterval(fetchBatches, 10000);
    
    // Clean up interval
    return () => clearInterval(intervalId);
  }, []);

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/batch/${id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-yellow-500">Processing</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading batch history...</span>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">No batch jobs found. Upload a CSV file to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium max-w-[200px] truncate">
                {batch.filename}
              </TableCell>
              <TableCell>{getStatusBadge(batch.status)}</TableCell>
              <TableCell>
                {batch.totalRows > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(batch.processedRows / batch.totalRows) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {batch.processedRows}/{batch.totalRows}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {new Date(batch.createdAt).toLocaleDateString()}
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true })}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(batch.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}