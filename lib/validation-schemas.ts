import { z } from 'zod';
import { UserRole, TransactionType, LabelFormat, DistanceUnit, MassUnit } from '@/types/index';

// User validation schemas
export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(UserRole),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(254).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Credit management schemas
export const assignCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().max(10000),
  description: z.string().max(255).optional(),
});

export const revokeCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(255).optional(),
});

// Address validation schema
export const addressSchema = z.object({
  name: z.string().min(1).max(100),
  company: z.string().max(100).optional(),
  street1: z.string().min(1).max(100),
  street2: z.string().max(100).optional(),
  city: z.string().min(1).max(50),
  state: z.string().min(2).max(50),
  zip: z.string().min(3).max(20),
  country: z.string().length(2), // ISO 2-letter country code
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

// Parcel validation schema
export const parcelSchema = z.object({
  length: z.number().positive().max(200),
  width: z.number().positive().max(200),
  height: z.number().positive().max(200),
  distance_unit: z.nativeEnum(DistanceUnit),
  weight: z.number().positive().max(150),
  mass_unit: z.nativeEnum(MassUnit),
});

// Shipping label schemas
export const getRatesSchema = z.object({
  fromAddress: addressSchema,
  toAddress: addressSchema,
  parcel: parcelSchema,
});

export const purchaseLabelSchema = z.object({
  rateId: z.string().min(1),
  labelFormat: z.nativeEnum(LabelFormat).default(LabelFormat.PDF),
});

// Batch upload schema
export const batchUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  data: z.array(z.object({
    fromAddress: addressSchema,
    toAddress: addressSchema,
    parcel: parcelSchema,
  })).min(1).max(1000), // Limit batch size
});

// Transaction query schema
export const transactionQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
});

// Analytics query schema
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  userId: z.string().uuid().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// Search and filter schema
export const searchQuerySchema = z.object({
  query: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'creditBalance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
});

// Refund label schema
export const refundLabelSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// Update preferences schema
export const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().length(2).optional(),
});