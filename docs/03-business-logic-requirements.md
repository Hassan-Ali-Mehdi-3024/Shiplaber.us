# Business Logic & Requirements Document
## Shipping Label Management System

### Table of Contents
1. [Business Overview](#business-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Credit Management System](#credit-management-system)
4. [GoShippo Integration Requirements](#goshippo-integration-requirements)
5. [Core Feature Specifications](#core-feature-specifications)
6. [Security Requirements](#security-requirements)
7. [Business Rules & Validation](#business-rules--validation)
8. [Phase 2 Feature Requirements](#phase-2-feature-requirements)

---

## Business Overview

### Business Model
The Shipping Label Management System operates as a multi-tenant platform providing shipping label services through GoShippo API integration. The system uses an internal credit-based economy where:

- **Revenue Source**: Credits purchased by Super Admins and distributed through hierarchy
- **Cost Management**: All shipping costs are pre-paid through credit system
- **User Hierarchy**: Three-tier system (Super Admin → Reseller → User) enables scalable business distribution
- **Service Focus**: Streamlined shipping label creation with bulk processing capabilities

### Value Proposition
1. **For Super Admins**: Complete control over user hierarchy and credit distribution
2. **For Resellers**: Ability to manage their own user base and credit allocation
3. **For Users**: Simple, efficient shipping label creation without direct payment processing

### Key Business Metrics
- Total credits in circulation
- Label creation volume per user/reseller
- Credit utilization rates
- User engagement and retention
- GoShippo API usage and costs

---

## User Roles & Permissions

### Super Admin Role

#### Core Capabilities
- **User Management**: Create, edit, delete, and manage all Resellers and Users
- **Credit Authority**: Assign and revoke credits from any account without limitations
- **System Oversight**: View all system data, transactions, and user activities
- **Configuration**: Manage system settings and GoShippo integration
- **Reporting**: Access to comprehensive analytics and reporting

#### Specific Permissions
```typescript
interface SuperAdminPermissions {
  users: {
    create: ['RESELLER', 'USER'];
    read: ['SUPER_ADMIN', 'RESELLER', 'USER'];
    update: ['SUPER_ADMIN', 'RESELLER', 'USER'];
    delete: ['RESELLER', 'USER'];
    changePassword: ['SUPER_ADMIN', 'RESELLER', 'USER'];
  };
  credits: {
    assign: 'UNLIMITED';
    revoke: 'UNLIMITED';
    viewTransactions: 'ALL_USERS';
  };
  shipments: {
    create: true;
    viewAll: true;
    refund: true;
  };
  system: {
    viewAnalytics: true;
    manageSettings: true;
    accessLogs: true;
  };
}
```

#### Business Rules for Super Admin
- Cannot delete their own account
- Must maintain at least one active Super Admin in the system
- Can override any transaction or credit operation
- Has audit trail access for all system operations

### Reseller Role

#### Core Capabilities
- **User Management**: Create, edit, and manage Users under their account only
- **Credit Management**: Assign and revoke credits from their Users within their own credit balance
- **Data Access**: View data for Users they created only
- **Label Services**: Full access to shipping label creation and management

#### Specific Permissions
```typescript
interface ResellerPermissions {
  users: {
    create: ['USER'];
    read: ['OWNED_USERS']; // Only users they created
    update: ['OWNED_USERS'];
    delete: ['OWNED_USERS'];
    changePassword: ['OWNED_USERS'];
  };
  credits: {
    assign: 'WITHIN_BALANCE'; // Cannot exceed their own balance
    revoke: 'FROM_OWNED_USERS';
    viewTransactions: 'OWNED_USERS_ONLY';
  };
  shipments: {
    create: true;
    viewOwned: true;
    viewUsersShipments: true; // Their created users' shipments
    refund: 'OWNED_SHIPMENTS';
  };
  system: {
    viewOwnAnalytics: true;
    manageSettings: false;
    accessLogs: false;
  };
}
```

#### Business Rules for Reseller
- Cannot assign more credits than their current balance
- Cannot view or manage users created by other Resellers
- Cannot change their own password (only Super Admin can)
- Can view shipping details of their Users for support purposes
- Credit assignments to Users are deducted from Reseller's balance immediately

### User Role

#### Core Capabilities
- **Label Creation**: Create individual shipping labels through GoShippo integration
- **Bulk Processing**: Upload CSV files for bulk label creation
- **History Access**: View their own shipment and transaction history
- **Account Information**: View their credit balance and usage

#### Specific Permissions
```typescript
interface UserPermissions {
  users: {
    create: false;
    read: ['SELF']; // Only their own profile
    update: ['SELF']; // Limited fields only
    delete: false;
    changePassword: false; // Only their creator can change
  };
  credits: {
    assign: false;
    revoke: false;
    viewTransactions: 'SELF_ONLY';
  };
  shipments: {
    create: true;
    viewOwned: true;
    viewUsersShipments: false;
    refund: 'OWN_SHIPMENTS_ONLY';
  };
  system: {
    viewAnalytics: false;
    manageSettings: false;
    accessLogs: false;
  };
}
```

#### Business Rules for User
- Can only spend their available credit balance
- Cannot transfer credits to other users
- Cannot change their own password
- Must contact their creator (Reseller or Super Admin) for account issues
- Can only refund their own unused labels

---

## Credit Management System

### Credit Economy Structure

#### Credit Definition
- **1 Credit = $1.00 USD** in GoShippo shipping costs
- Credits are internal currency not tied to external payment processors
- All shipping costs are pre-calculated and deducted in credits
- No fractional credit transactions (all amounts rounded to nearest cent)

#### Credit Flow Architecture
```
Super Admin (Unlimited Credits)
    ↓ Assigns Credits
Reseller (Limited Balance)
    ↓ Assigns Credits (within balance)
User (Limited Balance)
    ↓ Spends Credits
GoShippo Label Purchase
```

### Credit Transaction Types

#### CREDIT_ASSIGN
```typescript
interface CreditAssignTransaction {
  type: 'CREDIT_ASSIGN';
  fromUser: number; // Super Admin or Reseller ID
  toUser: number;   // Recipient User ID
  amount: number;   // Positive amount
  description: string;
  authorization: 'SUPER_ADMIN' | 'RESELLER_WITHIN_BALANCE';
}
```

**Business Rules:**
- Super Admin can assign unlimited credits
- Reseller can only assign within their current balance
- Assigned credits are immediately available to recipient
- Reseller's balance is decreased by assigned amount

#### CREDIT_REVOKE
```typescript
interface CreditRevokeTransaction {
  type: 'CREDIT_REVOKE';
  fromUser: number; // User losing credits
  toUser: number;   // Super Admin or Reseller getting credits back
  amount: number;   // Positive amount
  reason: string;   // Required for audit
  authorization: 'SUPER_ADMIN' | 'RESELLER_WITHIN_SCOPE';
}
```

**Business Rules:**
- Cannot revoke more credits than user currently has
- Revoked credits return to the revoker's balance
- Reason is mandatory for audit trail
- Reseller can only revoke from their created users

#### LABEL_PURCHASE
```typescript
interface LabelPurchaseTransaction {
  type: 'LABEL_PURCHASE';
  userId: number;
  amount: number;
  shipmentId: number;
  shippoTransactionId: string;
  carrier: string;
  service: string;
}
```

**Business Rules:**
- User must have sufficient credits before purchase
- Credits are deducted immediately upon successful GoShippo transaction
- Failed GoShippo transactions do not deduct credits
- Purchase history is maintained for audit and refunds

#### LABEL_REFUND
```typescript
interface LabelRefundTransaction {
  type: 'LABEL_REFUND';
  userId: number;
  amount: number;
  originalShipmentId: number;
  shippoRefundId: string;
  reason: string;
}
```

**Business Rules:**
- Only unused labels can be refunded (per GoShippo rules)
- Refund amount matches original purchase amount
- Credits are returned to user's balance upon successful refund
- Refund window follows GoShippo's refund policy

### Credit Validation Rules

#### Assignment Validation
```typescript
function validateCreditAssignment(
  assignor: User,
  recipient: User,
  amount: number
): ValidationResult {
  // Super Admin can assign unlimited credits
  if (assignor.role === 'SUPER_ADMIN') {
    return { valid: true };
  }
  
  // Reseller can only assign within balance
  if (assignor.role === 'RESELLER') {
    if (amount > assignor.creditBalance) {
      return { 
        valid: false, 
        error: 'Insufficient credits in your account' 
      };
    }
    
    if (recipient.creatorId !== assignor.id) {
      return { 
        valid: false, 
        error: 'Cannot assign credits to users not created by you' 
      };
    }
  }
  
  return { valid: true };
}
```

#### Purchase Validation
```typescript
function validateLabelPurchase(
  user: User,
  cost: number
): ValidationResult {
  if (cost > user.creditBalance) {
    return {
      valid: false,
      error: 'Insufficient credits. Please contact your administrator.',
      requiredCredits: cost,
      availableCredits: user.creditBalance
    };
  }
  
  return { valid: true };
}
```

---

## GoShippo Integration Requirements

### API Integration Architecture

#### Authentication
- **Single Master API Key**: System uses one GoShippo account for all transactions
- **Sandbox Development**: All development uses GoShippo test environment
- **Production Security**: Live API key stored in secure environment variables
- **Rate Limiting**: Implement safeguards to prevent API quota exhaustion

#### Core API Endpoints Used

#### Address Validation
```typescript
interface AddressValidationRequest {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string; // Default: 'US'
  phone?: string;
  email?: string;
}
```

**GoShippo Endpoint**: `POST /addresses/`
**Purpose**: Validate and standardize addresses before rate calculation
**Error Handling**: Map GoShippo address errors to user-friendly messages

#### Rate Calculation
```typescript
interface RateRequest {
  address_from: string; // Address object ID
  address_to: string;   // Address object ID
  parcels: Parcel[];
  async: boolean; // false for synchronous response
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  distance_unit: 'in' | 'cm';
  weight: number;
  mass_unit: 'lb' | 'kg';
}
```

**GoShippo Endpoint**: `POST /shipments/`
**Purpose**: Get available shipping rates from multiple carriers
**Response Processing**: Filter rates, calculate costs, present to user

#### Label Purchase
```typescript
interface LabelPurchaseRequest {
  rate: string; // Rate object ID from rate calculation
  label_file_type: 'PDF' | 'PNG' | 'ZPL';
  async: boolean; // false for immediate response
}
```

**GoShippo Endpoint**: `POST /transactions/`
**Purpose**: Purchase shipping label and get tracking number
**Success Flow**: Store label URL, tracking number, deduct user credits

#### Label Refund
```typescript
interface RefundRequest {
  transaction: string; // Transaction object ID
  async: boolean; // false for immediate response
}
```

**GoShippo Endpoint**: `POST /refunds/`
**Purpose**: Refund unused shipping labels
**Success Flow**: Return credits to user, mark shipment as refunded

### Error Handling Strategy

#### GoShippo Error Mapping
```typescript
const shippoErrorMap = {
  // Address Validation Errors
  'INVALID_ADDRESS': 'Please verify the address and try again.',
  'UNDELIVERABLE_ADDRESS': 'This address cannot receive shipments.',
  'MISSING_STREET': 'Street address is required.',
  
  // Rate Calculation Errors
  'NO_RATES_AVAILABLE': 'No shipping options available for this route.',
  'WEIGHT_EXCEEDS_LIMIT': 'Package weight exceeds carrier limits.',
  'DIMENSIONS_INVALID': 'Package dimensions are invalid.',
  
  // Transaction Errors
  'INSUFFICIENT_FUNDS': 'Insufficient credits for this purchase.',
  'RATE_EXPIRED': 'Shipping rate has expired. Please recalculate.',
  'TRANSACTION_FAILED': 'Label purchase failed. Please try again.',
  
  // Refund Errors
  'REFUND_NOT_ELIGIBLE': 'This label is not eligible for refund.',
  'REFUND_EXPIRED': 'Refund period has expired.',
  'ALREADY_REFUNDED': 'This label has already been refunded.'
};
```

#### System Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    action?: string; // Suggested user action
    contactSupport?: boolean;
  };
}
```

### Data Synchronization

#### Shipment Status Tracking
- Store GoShippo transaction IDs for all labels
- Periodic status updates via GoShippo tracking API
- Real-time webhook support for status changes (Phase 2)

#### Cost Reconciliation
- Daily reconciliation of GoShippo charges vs. credit deductions
- Alert system for discrepancies
- Automated reporting for financial audit

---

## Core Feature Specifications

### Single Label Creation

#### User Flow
1. **Address Input**: From and To addresses with validation
2. **Package Details**: Weight, dimensions, package type selection
3. **Rate Comparison**: Display available shipping options with costs
4. **Purchase Confirmation**: Review details and confirm credit deduction
5. **Label Generation**: Download PDF/PNG label and save tracking info

#### Technical Requirements
```typescript
interface LabelCreationProcess {
  step1: {
    fromAddress: AddressInput;
    toAddress: AddressInput;
    validation: 'REAL_TIME';
  };
  step2: {
    packageDetails: ParcelInput;
    validation: 'CARRIER_LIMITS';
  };
  step3: {
    rateSelection: RateDisplay;
    costCalculation: 'LIVE_RATES';
  };
  step4: {
    confirmation: PurchaseConfirmation;
    creditValidation: 'PRE_PURCHASE';
  };
  step5: {
    labelGeneration: LabelDownload;
    tracking: TrackingNumber;
  };
}
```

#### Business Rules
- Address validation required before rate calculation
- User must have sufficient credits before showing rates
- Selected rate expires after 10 minutes (GoShippo limitation)
- Label generation must be instantaneous or fail gracefully

### Bulk Label Creation

#### CSV Template Requirements
```csv
from_name,from_company,from_street1,from_street2,from_city,from_state,from_zip,to_name,to_company,to_street1,to_street2,to_city,to_state,to_zip,weight,length,width,height,contents
John Doe,Acme Corp,123 Main St,,Anytown,CA,12345,Jane Smith,XYZ Inc,456 Oak Ave,Suite 200,Other City,NY,67890,2.5,10,8,6,Documents
```

#### Processing Requirements
- **File Size Limit**: 1000 rows maximum per upload
- **Background Processing**: Queue system for large batches
- **Progress Tracking**: Real-time status updates
- **Error Reporting**: Detailed failure reasons per row
- **Partial Success**: Generate labels for valid rows, report errors for invalid

#### Validation Rules
```typescript
interface CSVValidation {
  required_fields: [
    'from_name', 'from_street1', 'from_city', 'from_state', 'from_zip',
    'to_name', 'to_street1', 'to_city', 'to_state', 'to_zip',
    'weight', 'length', 'width', 'height'
  ];
  optional_fields: [
    'from_company', 'from_street2', 'to_company', 'to_street2', 'contents'
  ];
  validation_rules: {
    weight: 'number > 0';
    dimensions: 'number > 0';
    zip: 'valid_postal_code';
    state: 'valid_state_code';
  };
}
```

### User Management Features

#### User Creation Process
```typescript
interface UserCreationForm {
  personalInfo: {
    name: string;
    email: string; // Must be unique system-wide
    role: 'RESELLER' | 'USER'; // Super Admin can create both
  };
  authentication: {
    temporaryPassword: string; // Generated by creator
    mustChangePassword: boolean; // Always false - creator manages
  };
  authorization: {
    initialCredits: number; // Optional initial credit assignment
    permissions: RolePermissions;
  };
}
```

#### User Management Rules
- **Email Uniqueness**: Enforced at database level
- **Password Management**: Only creator can change passwords
- **Deactivation**: Soft delete - preserve data for audit
- **Credit Inheritance**: Deactivated user's credits return to creator

### Transaction History

#### History Display Features
- **Pagination**: 50 transactions per page
- **Filtering**: By date range, transaction type, amount
- **Search**: By description, reference ID, user name
- **Export**: CSV download of filtered results
- **Audit Trail**: Complete transaction chain for investigations

#### Data Privacy Rules
- Users see only their own transactions
- Resellers see their own + their created users' transactions
- Super Admins see all system transactions
- Sensitive data (like addresses) redacted in exports

---

## Security Requirements

### Authentication Security

#### Password Requirements
- **Minimum Length**: 8 characters
- **Complexity**: Mix of uppercase, lowercase, numbers
- **Creator Control**: Only user's creator can change passwords
- **No Self-Service**: Users cannot change their own passwords

#### Session Management
```typescript
interface SessionSecurity {
  tokenExpiry: '24_hours';
  refreshToken: 'automatic';
  concurrentSessions: 'single_device_only';
  ipValidation: 'optional';
  sessionInvalidation: 'on_password_change';
}
```

### Data Access Security

#### Role-Based Data Isolation
```typescript
interface DataAccessRules {
  SUPER_ADMIN: {
    canAccess: 'ALL_DATA';
    restrictions: 'NONE';
  };
  RESELLER: {
    canAccess: 'OWN_DATA' | 'CREATED_USERS_DATA';
    restrictions: 'NO_OTHER_RESELLERS_DATA';
  };
  USER: {
    canAccess: 'OWN_DATA_ONLY';
    restrictions: 'NO_OTHER_USERS_DATA';
  };
}
```

#### Database Security
- **Query Filtering**: All database queries automatically filtered by user access
- **Parameterized Queries**: Prevent SQL injection via Prisma ORM
- **Data Encryption**: Sensitive fields encrypted at rest
- **Audit Logging**: All data access and modifications logged

### API Security

#### Request Validation
```typescript
interface APISecurityLayer {
  authentication: 'JWT_TOKENS';
  authorization: 'ROLE_BASED_MIDDLEWARE';
  inputValidation: 'ZOD_SCHEMAS';
  rateLimiting: 'PER_USER_LIMITS';
  requestLogging: 'ALL_REQUESTS';
}
```

#### GoShippo Security
- **API Key Protection**: Stored in secure environment variables
- **Request Validation**: All data validated before sending to GoShippo
- **Response Validation**: GoShippo responses validated before storing
- **Error Sanitization**: No sensitive GoShippo data exposed to users

---

## Business Rules & Validation

### Credit System Rules

#### Credit Assignment Rules
1. Super Admin can assign unlimited credits to any user
2. Reseller can assign credits only within their current balance
3. Credit assignments are immediate and irreversible (except by revocation)
4. Minimum assignment amount: $0.01 (1 credit)
5. Maximum assignment amount: No limit for Super Admin, balance limit for Reseller

#### Credit Usage Rules
1. Credits can only be spent on shipping labels through the system
2. No credit transfers between users (except through hierarchy)
3. Credits expire only when user account is deactivated
4. Refunded credits return to original purchaser's account
5. Partial credit usage allowed (exact change given)

### User Hierarchy Rules

#### Creation Rules
1. Super Admin can create Resellers and Users
2. Reseller can create Users only
3. Users cannot create other users
4. Creator relationship is permanent and immutable
5. Maximum hierarchy depth: 3 levels (Super Admin → Reseller → User)

#### Management Rules
1. Users can only be managed by their creator or Super Admin
2. Deactivating a Reseller requires handling their Users (transfer or deactivate)
3. Password changes can only be performed by creator or higher
4. Credit operations follow hierarchy permissions strictly
5. Data visibility respects creator relationships

### Shipping Rules

#### Label Creation Rules
1. All addresses must be validated before rate calculation
2. Package weight/dimensions must meet carrier requirements
3. User must have sufficient credits before label purchase
4. Rate selection expires after 10 minutes
5. One label per successful transaction

#### Refund Rules
1. Labels can only be refunded by the purchaser or their creator
2. Refund eligibility determined by GoShippo policies
3. Refunds return exact purchase amount in credits
4. Refunded labels marked as voided in system
5. No partial refunds allowed

### Data Validation Rules

#### Address Validation
```typescript
interface AddressValidationRules {
  required: ['name', 'street1', 'city', 'state', 'zip'];
  optional: ['company', 'street2', 'phone', 'email'];
  formats: {
    zip: /^\d{5}(-\d{4})?$/;
    state: 'VALID_US_STATE_CODE';
    phone: 'E164_FORMAT_OPTIONAL';
    email: 'RFC5322_COMPLIANT';
  };
  restrictions: {
    po_boxes: 'ALLOWED_FOR_CERTAIN_SERVICES';
    international: 'US_ONLY_FOR_MVP';
  };
}
```

#### Package Validation
```typescript
interface PackageValidationRules {
  weight: {
    min: 0.1; // 0.1 lbs
    max: 150; // 150 lbs (varies by carrier)
    unit: 'pounds';
  };
  dimensions: {
    min: 1; // 1 inch
    max: 108; // 108 inches (varies by carrier)
    unit: 'inches';
  };
  restrictions: {
    hazardous_materials: 'NOT_ALLOWED';
    prohibited_items: 'CARRIER_SPECIFIC_RULES';
  };
}
```

---

## Phase 2 Feature Requirements

### E-commerce Platform Integration

#### Amazon Integration
- **Order Import**: Fetch orders via Amazon MWS/SP-API
- **Address Mapping**: Convert Amazon order data to shipping addresses
- **Inventory Sync**: Link Amazon SKUs to internal inventory
- **Fulfillment Updates**: Mark orders as shipped with tracking info

#### Walmart Integration
- **Marketplace API**: Connect to Walmart Marketplace for order data
- **Bulk Processing**: Handle high-volume Walmart orders efficiently
- **Return Labels**: Generate return shipping labels for Walmart orders

#### eBay Integration
- **Trading API**: Fetch eBay sales data and buyer information
- **Multi-Site Support**: Handle international eBay sites
- **Feedback Integration**: Link shipping performance to eBay metrics

### Advanced Analytics

#### Dashboard Enhancements
```typescript
interface AdvancedAnalytics {
  metrics: {
    cost_per_label: 'ROLLING_AVERAGE';
    shipping_trends: 'MONTHLY_COMPARISON';
    carrier_performance: 'DELIVERY_TIMES';
    user_activity: 'ENGAGEMENT_SCORES';
  };
  reports: {
    financial_summary: 'CREDIT_FLOW_ANALYSIS';
    operational_efficiency: 'PROCESSING_TIMES';
    customer_insights: 'USER_BEHAVIOR_PATTERNS';
  };
  alerts: {
    credit_low_balance: 'THRESHOLD_WARNINGS';
    unusual_activity: 'ANOMALY_DETECTION';
    system_errors: 'REAL_TIME_MONITORING';
  };
}
```

### API Access Layer

#### Public API Features
- **Rate Calculation**: Allow third-party rate shopping
- **Label Creation**: Programmatic label generation
- **Tracking**: Real-time shipment status updates
- **Credit Management**: API-based credit operations (with permissions)

#### API Security
```typescript
interface PublicAPIRequirements {
  authentication: 'API_KEY_BASED';
  authorization: 'ROLE_SCOPED_PERMISSIONS';
  rateLimiting: 'TIERED_BY_SUBSCRIPTION';
  documentation: 'OPENAPI_SPECIFICATION';
  monitoring: 'USAGE_ANALYTICS';
}
```

### Return Management System

#### Return Label Generation
- **Prepaid Returns**: Generate return labels charged to original sender
- **Return Reasons**: Categorize returns for analytics
- **Return Tracking**: Monitor return shipment progress
- **Credit Handling**: Manage credit flows for return shipping

#### Return Processing Workflow
```typescript
interface ReturnWorkflow {
  initiation: {
    triggers: ['CUSTOMER_REQUEST', 'QUALITY_ISSUE', 'WRONG_ITEM'];
    approval: 'AUTOMATIC' | 'MANUAL_REVIEW';
  };
  label_generation: {
    cost_allocation: 'SENDER' | 'RECEIVER' | 'SPLIT';
    service_level: 'GROUND' | 'EXPEDITED';
  };
  tracking: {
    notifications: 'EMAIL_UPDATES';
    status_sync: 'REAL_TIME';
  };
  completion: {
    credit_processing: 'AUTOMATIC';
    reporting: 'ANALYTICS_INTEGRATION';
  };
}
```

### Inventory Management

#### Product Catalog
- **SKU Management**: Create and maintain product catalog
- **Weight/Dimension Profiles**: Automate package calculations
- **Shipping Rules**: SKU-specific shipping restrictions
- **Cost Analysis**: Track shipping costs per product

#### Integration Points
```typescript
interface InventoryIntegration {
  ecommerce_sync: {
    platforms: ['AMAZON', 'WALMART', 'EBAY', 'SHOPIFY'];
    sync_frequency: 'REAL_TIME' | 'HOURLY' | 'DAILY';
    conflict_resolution: 'MANUAL_REVIEW';
  };
  shipping_optimization: {
    box_selection: 'AUTOMATED_FITTING';
    multi_item_packaging: 'CONSOLIDATION_RULES';
    cost_minimization: 'CARRIER_SELECTION';
  };
}
```

### Advanced User Management

#### Enhanced Permissions
- **Custom Roles**: Define organization-specific roles
- **Department Management**: Group users by departments/teams
- **Budget Controls**: Set spending limits per user/department
- **Approval Workflows**: Require approval for high-value shipments

#### Multi-Organization Support
```typescript
interface MultiOrgStructure {
  organizations: {
    hierarchy: 'UNLIMITED_DEPTH';
    isolation: 'COMPLETE_DATA_SEPARATION';
    branding: 'CUSTOM_LOGOS_COLORS';
  };
  cross_org_features: {
    consolidated_billing: 'OPTIONAL';
    shared_addresses: 'PERMISSION_BASED';
    reporting: 'AGGREGATED_VIEWS';
  };
}
```

---

This business logic and requirements document provides the comprehensive foundation for implementing a robust, scalable shipping label management system that meets current MVP needs while planning for future growth and feature expansion.