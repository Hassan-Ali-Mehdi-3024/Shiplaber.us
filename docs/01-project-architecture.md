# Project Architecture Document
## Shipping Label Management System

### Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [API Architecture](#api-architecture)
5. [Security Architecture](#security-architecture)
6. [Integration Architecture](#integration-architecture)
7. [Phase 2 Considerations](#phase-2-considerations)

---

## System Overview

### Application Purpose
A Next.js-based shipping label management system that integrates with GoShippo API to provide multi-tier user management with an internal credit system for purchasing shipping labels.

### Core Architecture Pattern
- **Frontend**: Next.js 14+ with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom session-based authentication
- **State Management**: Zustand for client-side state
- **Styling**: Tailwind CSS with Shadcn/UI components

### System Hierarchy
```
Super Admin
    ├── Can create/manage Resellers and Users
    ├── Can assign/revoke credits from any account
    ├── Can view all system data
    └── Manages GoShippo integration
    
Reseller
    ├── Can create/manage Users under their account
    ├── Can assign/revoke credits within their balance
    ├── Can view data for their created users only
    └── Cannot change own password (Super Admin only)
    
User
    ├── Can create shipping labels
    ├── Can view own shipment history
    ├── Cannot change own password (Creator only)
    └── Cannot manage other users
```

---

## Technology Stack

### Frontend Technologies
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Built-in fetch with custom wrapper

### Backend Technologies
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Custom JWT/session management
- **File Processing**: CSV parsing for bulk operations
- **Background Jobs**: Simple queue system for batch processing

### External Integrations
- **Shipping API**: GoShippo REST API
- **File Storage**: Local storage for CSV uploads (MVP), future cloud storage
- **Email**: Not required for MVP (no notifications)

### Development Tools
- **Package Manager**: npm/yarn
- **Code Quality**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest + React Testing Library (Phase 2)
- **Version Control**: Git

---

## Database Architecture

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  role              user_role NOT NULL,
  credit_balance    DECIMAL(10,2) DEFAULT 0.00,
  creator_id        INTEGER REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  is_active         BOOLEAN DEFAULT true
);

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'RESELLER', 'USER');
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  transaction_type  transaction_type NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  description       TEXT,
  reference_id      VARCHAR(255), -- For shipment or batch references
  created_by        INTEGER REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TYPE transaction_type AS ENUM (
  'CREDIT_ASSIGN',    -- Admin/Reseller assigns credits
  'CREDIT_REVOKE',    -- Admin/Reseller revokes credits
  'LABEL_PURCHASE',   -- User purchases shipping label
  'LABEL_REFUND'      -- Refund from cancelled label
);
```

#### Shipments Table
```sql
CREATE TABLE shipments (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id),
  shippo_transaction_id VARCHAR(255) UNIQUE,
  shippo_object_id      VARCHAR(255),
  tracking_number       VARCHAR(255),
  label_url             TEXT,
  cost                  DECIMAL(10,2),
  carrier               VARCHAR(100),
  service_level         VARCHAR(100),
  from_address          JSONB,
  to_address            JSONB,
  parcel_details        JSONB,
  status                shipment_status DEFAULT 'PENDING',
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE TYPE shipment_status AS ENUM (
  'PENDING', 'PURCHASED', 'REFUNDED', 'ERROR'
);
```

#### Batches Table (For CSV uploads)
```sql
CREATE TABLE batches (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  filename        VARCHAR(255),
  total_rows      INTEGER,
  processed_rows  INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows     INTEGER DEFAULT 0,
  status          batch_status DEFAULT 'PROCESSING',
  error_log       TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  completed_at    TIMESTAMP
);

CREATE TYPE batch_status AS ENUM (
  'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
);
```

### Database Relationships
- Users have a hierarchical relationship (creator_id references users.id)
- All transactions are linked to specific users
- All shipments are owned by specific users
- Batches track bulk upload operations per user

### Indexes for Performance
```sql
-- User management queries
CREATE INDEX idx_users_creator_id ON users(creator_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Transaction history queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- Shipment queries
CREATE INDEX idx_shipments_user_id ON shipments(user_id);
CREATE INDEX idx_shipments_created_at ON shipments(created_at);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);

-- Batch processing queries
CREATE INDEX idx_batches_user_id ON batches(user_id);
CREATE INDEX idx_batches_status ON batches(status);
```

---

## API Architecture

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

### User Management Endpoints
```
GET    /api/users              # List users (filtered by role)
POST   /api/users              # Create new user
GET    /api/users/[id]         # Get user details
PUT    /api/users/[id]         # Update user
DELETE /api/users/[id]         # Deactivate user
PUT    /api/users/[id]/password # Change user password
```

### Credit Management Endpoints
```
GET  /api/credits/balance/[userId]     # Get user credit balance
POST /api/credits/assign               # Assign credits to user
POST /api/credits/revoke               # Revoke credits from user
GET  /api/credits/transactions/[userId] # Get transaction history
```

### Shipping Label Endpoints
```
POST /api/shippo/validate-address     # Validate shipping address
POST /api/shippo/get-rates           # Get shipping rates
POST /api/shippo/create-label        # Purchase shipping label
POST /api/shippo/refund-label        # Refund unused label
GET  /api/shipments                  # Get shipment history
GET  /api/shipments/[id]             # Get shipment details
```

### Bulk Operations Endpoints
```
POST /api/bulk/upload-csv            # Upload CSV for batch processing
GET  /api/bulk/batches               # Get batch list
GET  /api/bulk/batches/[id]          # Get batch details
GET  /api/bulk/batches/[id]/download # Download batch results
POST /api/bulk/download-template     # Download CSV template
```

### Dashboard & Analytics Endpoints
```
GET /api/dashboard/stats             # Get dashboard metrics
GET /api/dashboard/recent-activity   # Get recent user activity
```

### API Response Format
All API responses follow this structure:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## Security Architecture

### Authentication & Authorization
1. **Password Security**: Bcrypt hashing with salt rounds
2. **Session Management**: Secure HTTP-only cookies
3. **Role-Based Access Control**: Middleware validates user roles
4. **Data Isolation**: Query-level filtering ensures users only see their data

### Data Protection
1. **Input Validation**: Zod schemas for all inputs
2. **SQL Injection Prevention**: Prisma ORM with parameterized queries
3. **XSS Prevention**: React's built-in escaping + Content Security Policy
4. **CSRF Protection**: SameSite cookies + custom tokens

### API Security
1. **Rate Limiting**: Prevent abuse of GoShippo API calls
2. **Request Validation**: Strict TypeScript interfaces
3. **Error Handling**: No sensitive data in error responses
4. **Audit Logging**: All credit transactions logged

### GoShippo Integration Security
1. **API Key Management**: Single master key stored in environment variables
2. **Sandbox Mode**: Development uses test API keys only
3. **Request Filtering**: Validate all data before sending to GoShippo
4. **Response Validation**: Verify GoShippo responses before storing

---

## Integration Architecture

### GoShippo API Integration

#### Core Integration Flow
```
1. User submits shipping request
2. Backend validates request and user credits
3. Backend calls GoShippo API endpoints:
   - Address validation
   - Rate calculation
   - Label purchase
4. Backend stores transaction and updates user credits
5. Frontend displays results to user
```

#### GoShippo API Endpoints Used
- **Address Validation**: `POST /addresses/`
- **Rate Calculation**: `POST /shipments/` (for rates)
- **Label Purchase**: `POST /transactions/`
- **Label Refund**: `POST /refunds/`

#### Error Handling Strategy
```typescript
interface GoShippoError {
  code: string;
  message: string;
  field?: string;
}

// Map GoShippo errors to user-friendly messages
const errorMessages = {
  'INSUFFICIENT_FUNDS': 'Insufficient credits. Please contact your administrator.',
  'INVALID_ADDRESS': 'Please verify the shipping address and try again.',
  'CARRIER_ERROR': 'Shipping carrier temporarily unavailable. Please try again.'
};
```

### CSV Processing Architecture
1. **Upload**: Files stored temporarily on server
2. **Validation**: CSV structure validated against template
3. **Background Processing**: Queue system processes rows sequentially
4. **Progress Tracking**: Real-time status updates in database
5. **Result Generation**: Success/failure report with downloadable labels

---

## Phase 2 Considerations

### Planned Enhancements
1. **E-commerce Integration**: Amazon, Walmart, eBay order imports
2. **Advanced Analytics**: Detailed reporting and insights
3. **Return Management**: Return label generation and tracking
4. **Inventory Management**: SKU tracking and management
5. **API Access**: Public API for third-party integrations

### Database Schema Extensions
```sql
-- Phase 2 tables
CREATE TABLE integrations (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id),
  platform     VARCHAR(50), -- 'AMAZON', 'WALMART', 'EBAY'
  credentials  JSONB,       -- Encrypted API keys/tokens
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id),
  sku         VARCHAR(255),
  name        VARCHAR(255),
  weight      DECIMAL(8,2),
  dimensions  JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Architecture Scalability
- **Database**: Ready for horizontal scaling with read replicas
- **API**: Stateless design allows for load balancing
- **File Storage**: Easy migration to cloud storage (AWS S3, etc.)
- **Background Jobs**: Can be moved to Redis/Queue system
- **Caching**: Redis can be added for session and data caching

---

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried columns
- Pagination for large datasets
- Connection pooling with Prisma
- Query optimization for hierarchical user data

### Frontend Optimization
- Component lazy loading
- Image optimization for shipping labels
- Client-side caching with Zustand
- Debounced search and form inputs

### API Optimization
- Response caching for static data
- Batch operations for bulk actions
- GoShippo API call optimization
- Background processing for heavy operations

---

This architecture document provides the foundation for all development phases and ensures scalability, security, and maintainability throughout the project lifecycle.