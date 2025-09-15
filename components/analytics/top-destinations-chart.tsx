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
  ResponsiveContainer,
  Cell
} from "recharts";
import { Loader2 } from "lucide-react";

import { ChartPeriod, DestinationData } from './types';

interface TopDestinationsChartProps extends ChartPeriod {}

// Colors for different destinations
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c'];

export default function TopDestinationsChart({ period }: TopDestinationsChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DestinationData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analytics/top-destinations?period=${period}`);
        if (!response.ok) {
          throw new Error("Failed to fetch top destinations data");
        }
        
        const chartData = await response.json();
        setData(chartData);
      } catch (error) {
        console.error("Error fetching top destinations data:", error);
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
      <BarChart
        data={data}
        layout="vertical"
        margin={{
          top: 5,
          right: 30,
          left: 80,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" />
        <Tooltip 
          formatter={(value: number) => [`${value} shipments`, 'Shipments']}
        />
        <Legend />
        <Bar dataKey="value" name="Shipments">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}