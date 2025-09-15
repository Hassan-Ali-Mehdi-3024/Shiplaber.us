"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Loader2 } from "lucide-react";

import { ChartPeriod, CreditUsageDataPoint } from './types';

interface CreditUsageChartProps extends ChartPeriod {
  showAllocated?: boolean;
}

export default function CreditUsageChart({ period, showAllocated = false }: CreditUsageChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<CreditUsageDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const endpoint = showAllocated ? 'credit-allocation' : 'credit-usage';
        const response = await fetch(`/api/analytics/${endpoint}?period=${period}`);
        if (!response.ok) {
          throw new Error("Failed to fetch credit usage data");
        }
        
        const chartData = await response.json();
        setData(chartData);
      } catch (error) {
        console.error("Error fetching credit usage data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period, showAllocated]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
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
          formatter={(value) => [`$${value}`, '']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Bar dataKey="spent" name="Credits Spent" fill="#3b82f6" />
        {showAllocated && (
          <Bar dataKey="allocated" name="Credits Allocated" fill="#10b981" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}