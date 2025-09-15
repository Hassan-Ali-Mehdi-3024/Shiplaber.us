"use client";

import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Loader2 } from "lucide-react";

import { ChartPeriod, ShippingVolumeDataPoint } from './types';

interface ShippingVolumeChartProps extends ChartPeriod {}

export default function ShippingVolumeChart({ period }: ShippingVolumeChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ShippingVolumeDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analytics/shipping-volume?period=${period}`);
        if (!response.ok) {
          throw new Error("Failed to fetch shipping volume data");
        }
        
        const chartData = await response.json();
        setData(chartData);
      } catch (error) {
        console.error("Error fetching shipping volume data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`${value} shipments`, 'Volume']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="Shipments"
          stroke="#3b82f6"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}