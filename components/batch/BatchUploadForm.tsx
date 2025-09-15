"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  AlertCircle,
  Upload,
  Check,
  FileText,
  Download
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BatchUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Please select a valid CSV file");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setError(null);

    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload to API
      const response = await fetch("/api/labels/batch", {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const data = await response.json();
      setBatchId(data.id);
      
      setProgress(100);
      toast({
        title: "Upload successful",
        description: "Your batch job has been submitted for processing",
        variant: "default",
      });
      
      // Redirect to batch status page after 1 second
      setTimeout(() => {
        router.push(`/dashboard/batch/${data.id}`);
      }, 1000);
      
    } catch (err) {
      setProgress(0);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV header line
    const csvContent = "to_name,to_company,to_street1,to_street2,to_city,to_state,to_zip,to_country,to_phone,to_email,from_name,from_company,from_street1,from_street2,from_city,from_state,from_zip,from_country,from_phone,from_email,weight,mass_unit,length,width,height,distance_unit,reference,carrier,service_level";
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", "shipping_labels_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="csv-file" className="text-sm font-medium">
            Select CSV File
          </label>
          <div className="flex items-center gap-2">
            <Input 
              ref={fileInputRef}
              id="csv-file" 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              title="Download CSV Template"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with shipping details. Maximum 1000 rows.
          </p>
        </div>

        {file && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">File Details</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground text-sm ml-auto">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {progress < 100 ? "Uploading..." : "Processing..."}
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload and Process
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="pt-4">
        <h3 className="text-sm font-semibold mb-2">CSV Format Requirements</h3>
        <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
          <li>Must include headers matching our template</li>
          <li>Required fields: to_name, to_street1, to_city, to_state, to_zip, to_country, from_name, from_street1, from_city, from_state, from_zip, from_country, weight, mass_unit, length, width, height, distance_unit</li>
          <li>Optional fields include packageType, carrier, serviceLevel</li>
          <li>If carrier/service not specified, cheapest option is selected</li>
        </ul>
      </div>
    </div>
  );
}