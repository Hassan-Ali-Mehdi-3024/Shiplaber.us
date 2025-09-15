"use client";

// Common types for analytics charts
export interface ChartPeriod {
  period: string;
}

export interface ShippingVolumeDataPoint {
  date: string;
  value: number;
}

export interface CreditUsageDataPoint {
  date: string;
  spent: number;
  allocated?: number;
}

export interface CarrierData {
  name: string;
  shipments: number;
  cost?: number;
}

export interface DestinationData {
  name: string;
  value: number;
}

export interface SummaryData {
  totalShipments: number;
  totalCreditsSpent: number;
  avgShipmentCost: number;
  activeUsers: number;
}