// Enums for better type safety
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  RESELLER = 'RESELLER',
  USER = 'USER',
}

export enum TransactionType {
  CREDIT_ASSIGN = 'CREDIT_ASSIGN',
  CREDIT_REVOKE = 'CREDIT_REVOKE',
  LABEL_PURCHASE = 'LABEL_PURCHASE',
  LABEL_REFUND = 'LABEL_REFUND',
}

export enum ShipmentStatus {
  PENDING = 'PENDING',
  PURCHASED = 'PURCHASED',
  REFUNDED = 'REFUNDED',
  ERROR = 'ERROR',
}

export enum BatchStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum LabelFormat {
  PDF = 'PDF',
  PNG = 'PNG',
  ZPL = 'ZPL',
}

export enum DistanceUnit {
  IN = 'in',
  CM = 'cm',
}

export enum MassUnit {
  LB = 'lb',
  KG = 'kg',
}

// Core entity types
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  creditBalance: number;
  emailNotifications: boolean;
  marketingEmails: boolean;
  creatorId: string | null;
  creator?: User | null;
  createdUsers?: User[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  sentTransactions?: Transaction[];
  receivedTransactions?: Transaction[];
  shipments?: Shipment[];
  batches?: Batch[];
}

export interface Transaction {
  id: string;
  userId: string;
  user: User;
  transactionType: TransactionType;
  amount: number;
  description: string | null;
  referenceId: string | null;
  createdById: string;
  createdBy: User;
  createdAt: Date;
}

export interface Shipment {
  id: string;
  userId: string;
  user: User;
  shippoTransactionId: string | null;
  shippoObjectId: string | null;
  trackingNumber: string | null;
  labelUrl: string | null;
  cost: number | null;
  carrier: string | null;
  serviceLevel: string | null;
  fromAddress: string; // JSON string
  toAddress: string; // JSON string
  parcelDetails: string; // JSON string
  status: ShipmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Batch {
  id: string;
  userId: string;
  user: User;
  filename: string | null;
  totalRows: number | null;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  status: BatchStatus;
  errorLog: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// Address types
export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ValidatedAddress extends Address {
  object_id: string;
  validation_results: {
    is_valid: boolean;
    messages: Array<{
      code: string;
      text: string;
      type: string;
    }>;
  };
}

// Parcel types
export interface Parcel {
  length: number;
  width: number;
  height: number;
  distance_unit: DistanceUnit;
  weight: number;
  mass_unit: MassUnit;
}

// Shipping rate types
export interface ShippingRate {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  provider_image_75: string;
  provider_image_200: string;
  servicelevel: {
    name: string;
    token: string;
    terms: string;
  };
  estimated_days: number;
  duration_terms: string;
}

export interface ShippingRatesResponse {
  rates: ShippingRate[];
  address_from: string;
  address_to: string;
  parcels: string[];
}

// Label transaction types
export interface LabelTransaction {
  object_id: string;
  status: string;
  tracking_number: string;
  tracking_url_provider: string;
  eta: string;
  label_url: string;
  commercial_invoice_url?: string;
  metadata: string;
  messages: Array<{
    code: string;
    text: string;
    type: string;
  }>;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

// Analytics types
export interface AnalyticsData {
  period: string;
  value: number;
  label?: string;
}

export interface DashboardSummary {
  totalUsers: number;
  totalShipments: number;
  totalRevenue: number;
  totalCreditsAssigned: number;
  recentTransactions: Transaction[];
  shippingVolumeData: AnalyticsData[];
  carrierDistribution: AnalyticsData[];
}

// Form types
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  emailNotifications?: boolean;
  marketingEmails?: boolean;
}

export interface CreditAssignmentData {
  userId: string;
  amount: number;
  description?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Session types
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  creditBalance: number;
}

// Error types
export interface ApplicationError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

// Batch processing types
export interface BatchRow {
  fromAddress: Address;
  toAddress: Address;
  parcel: Parcel;
}

export interface BatchProcessingResult {
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// Utility types
export type CreateUser = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'createdUsers' | 'sentTransactions' | 'receivedTransactions' | 'shipments' | 'batches'>;
export type UpdateUser = Partial<Pick<User, 'name' | 'email' | 'role' | 'isActive' | 'emailNotifications' | 'marketingEmails'>>;
export type CreateTransaction = Omit<Transaction, 'id' | 'createdAt' | 'user' | 'createdBy'>;
export type CreateShipment = Omit<Shipment, 'id' | 'createdAt' | 'updatedAt' | 'user'>;
export type CreateBatch = Omit<Batch, 'id' | 'createdAt' | 'completedAt' | 'user'>;

// Type guards
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

export function isValidTransactionType(type: string): type is TransactionType {
  return Object.values(TransactionType).includes(type as TransactionType);
}

export function isValidShipmentStatus(status: string): status is ShipmentStatus {
  return Object.values(ShipmentStatus).includes(status as ShipmentStatus);
}

export function isValidBatchStatus(status: string): status is BatchStatus {
  return Object.values(BatchStatus).includes(status as BatchStatus);
}

// Constants
export const USER_ROLE_HIERARCHY = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.RESELLER]: 2,
  [UserRole.USER]: 1,
};

export const MAX_CREDIT_ASSIGNMENT = 10000;
export const MAX_BATCH_SIZE = 1000;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Helper functions
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  return USER_ROLE_HIERARCHY[managerRole] > USER_ROLE_HIERARCHY[targetRole];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}