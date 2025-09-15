# Shipping Label Management System

A Next.js application that integrates with GoShippo API for multi-tier shipping label management.

## Project Status

This project is currently in development. The foundation is set up with:

- Next.js 14+ with App Router and TypeScript
- Tailwind CSS with Shadcn/UI components
- PostgreSQL with Prisma ORM
- Custom session-based authentication (JWT/HTTP-only cookies)
- Zustand for client-side state management

## System Architecture

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, Shadcn/UI components
- **Backend**: Next.js API Routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom session-based authentication (JWT/HTTP-only cookies)
- **State Management**: Zustand for client-side state
- **API Integration**: GoShippo for shipping label services

## User Hierarchy

```
Super Admin
    ├── Creates/manages Resellers and Users
    ├── Assigns/revokes credits from any account
    └── Full system access
    
Reseller
    ├── Creates/manages Users under their account
    ├── Assigns/revokes credits within their balance
    └── Limited to own user data
    
User
    ├── Creates shipping labels
    └── Views own shipment history
```

## Credit System

- Credits represent USD value for shipping labels (1 credit = $1.00)
- Credits flow down the hierarchy (Super Admin → Reseller → User)
- Users spend credits to purchase shipping labels
- All operations are recorded as transactions

## Setup Instructions

```bash
# Clone and install dependencies
git clone [repository]
cd shipping-label-app
npm install

# Set up environment
# Create .env.local with:
# - DATABASE_URL
# - SHIPPO_API_KEY (sandbox for development)
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL

# Initialize database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

## Current Implementation Status

- ✅ Project structure and configuration
- ✅ Prisma schema and database model
- ✅ Authentication system
- ✅ Dashboard UI and layout
- ✅ Basic API routes
- ✅ User management 
- ✅ Credit management system
- ✅ GoShippo API integration
- ✅ Shipping label API endpoints
- ✅ Shipping label creation UI components
- ✅ Batch processing for CSV uploads
- ✅ Reporting and analytics dashboards

## Implemented Features

### User Management
- User CRUD operations with role-based access
- Hierarchical user structure with Super Admin, Reseller, and User roles
- User interface for adding, editing, and deleting users

### Credit System
- Credit management API endpoints
- Credit transfer between user tiers
- Credit balance tracking and transaction history

### Shipping Label Creation
- Address validation via GoShippo API
- Shipping rate calculations
- Package information handling
- Shipping label purchase workflow
- Label generation and tracking
- Refund functionality

### Batch Processing
- CSV file upload for multiple shipping labels
- Background processing of batch shipments
- CSV template download with required fields
- Batch job status tracking
- Detailed error reporting
- Role-based access to batch jobs

### Reporting and Analytics
- Interactive dashboards with filtering by time period
- Shipping volume trends and visualizations
- Credit usage and allocation tracking
- Carrier distribution analysis
- Top shipping destinations reporting
- User activity metrics

## Next Steps

The next phase of development involves:

1. Testing and refining all implemented features
2. Enhancing error handling and validation throughout the application
3. Implementing additional carriers and service levels
4. Adding more advanced reporting features
3. Building reporting and analytics dashboards
4. Enhancing error handling and validation throughout the application
5. Implementing additional carriers and service levels

## Documentation

For more details, refer to the documentation in `/docs/`:
- `01-project-architecture.md` - System architecture and database schema
- `02-ui-ux-design.md` - UI components and design patterns
- `03-business-logic-requirements.md` - Business rules and validation
- `04-development-implementation-guide.md` - Development workflow