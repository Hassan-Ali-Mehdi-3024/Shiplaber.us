import { Metadata } from "next";
import BatchUploadForm from "@/components/batch/BatchUploadForm";
import BatchHistory from "@/components/batch/BatchHistory";

export const metadata: Metadata = {
  title: "Batch Label Processing",
  description: "Upload CSV files to create multiple shipping labels at once",
};

export default function BatchPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Batch Label Processing</h1>
      
      <div className="grid gap-8">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Upload CSV</h2>
          <BatchUploadForm />
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Batch Jobs</h2>
          <BatchHistory />
        </div>
      </div>
    </div>
  );
}