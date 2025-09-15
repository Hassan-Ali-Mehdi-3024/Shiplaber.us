import { Metadata } from "next";
import AnalyticsDashboard from "@/components/analytics/analytics-dashboard";

export const metadata: Metadata = {
  title: "Shipping Analytics",
  description: "Shipping activity and credit usage analytics",
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Shipping Analytics</h1>
      
      <AnalyticsDashboard />
    </div>
  );
}