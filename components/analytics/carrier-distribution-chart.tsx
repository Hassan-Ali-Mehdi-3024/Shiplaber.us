"use client";

import { useState, useEffect } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Loader2 } from "lucide-react";

import { ChartPeriod, CarrierData } from './types';

interface CarrierDistributionChartProps extends ChartPeriod {
  showCosts?: boolean;
}

// Colors for different carriers
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function CarrierDistributionChart({ period, showCosts = false }: CarrierDistributionChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<CarrierData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const endpoint = showCosts ? 'carrier-costs' : 'carrier-distribution';
        const response = await fetch(`/api/analytics/${endpoint}?period=${period}`);
        if (!response.ok) {
          throw new Error("Failed to fetch carrier distribution data");
        }
        
        const chartData = await response.json();
        setData(chartData);
      } catch (error) {
        console.error("Error fetching carrier distribution data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period, showCosts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showCosts) {
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
            formatter={(value: number, name) => {
              if (name === 'shipments') return [`${value} shipments`, 'Shipments'];
              if (name === 'cost') return [`$${value.toFixed(2)}`, 'Total Cost'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar dataKey="shipments" name="Shipments" fill="#3b82f6" />
          <Bar dataKey="cost" name="Total Cost" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="shipments"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value} shipments`, '']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}