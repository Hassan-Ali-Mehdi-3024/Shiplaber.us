"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  BarChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Loader2 } from "lucide-react";
import ShippingVolumeChart from "@/components/analytics/shipping-volume-chart";
import CreditUsageChart from "@/components/analytics/credit-usage-chart";
import CarrierDistributionChart from "@/components/analytics/carrier-distribution-chart";
import TopDestinationsChart from "@/components/analytics/top-destinations-chart";

export default function AnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [summaryData, setSummaryData] = useState({
    totalShipments: 0,
    totalCreditsSpent: 0,
    avgShipmentCost: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // Fetch analytics data
    const fetchAnalyticsData = async () => {
      try {
        const response = await fetch(`/api/analytics/summary?period=${selectedPeriod}`);
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        
        const data = await response.json();
        setSummaryData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Activity</TabsTrigger>
          <TabsTrigger value="credits">Credit Usage</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
        </TabsList>

        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => handlePeriodChange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                selectedPeriod === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('month')}
              className={`px-4 py-2 text-sm font-medium ${
                selectedPeriod === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border-t border-b border-gray-200 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('year')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                selectedPeriod === 'year'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Year
            </button>
          </div>
        </div>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Shipments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryData.totalShipments}</div>
                <p className="text-xs text-muted-foreground">
                  For the selected period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Credits Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summaryData.totalCreditsSpent.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  For the selected period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Shipment Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summaryData.avgShipmentCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Per shipping label
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryData.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Creating shipments
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Shipping Volume</CardTitle>
                <CardDescription>
                  Number of shipments over time
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px]">
                  <ShippingVolumeChart period={selectedPeriod} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Credit Usage</CardTitle>
                <CardDescription>
                  Credits spent over time
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px]">
                  <CreditUsageChart period={selectedPeriod} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="shipping" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle>Top Destinations</CardTitle>
                <CardDescription>
                  Most common shipping destinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <TopDestinationsChart period={selectedPeriod} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle>Carrier Distribution</CardTitle>
                <CardDescription>
                  Shipments by carrier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <CarrierDistributionChart period={selectedPeriod} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Allocation and Spending</CardTitle>
              <CardDescription>
                Credits assigned and used over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <CreditUsageChart period={selectedPeriod} showAllocated={true} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Performance</CardTitle>
              <CardDescription>
                Shipments and costs by carrier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <CarrierDistributionChart period={selectedPeriod} showCosts={true} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}