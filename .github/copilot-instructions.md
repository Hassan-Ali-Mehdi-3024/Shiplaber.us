# Shipping Label Management System - AI Agent Guide

This document provides essential context for AI coding agents working on the Shipping Label Management System - a Next.js application that integrates with GoShippo API for multi-tier shipping label management.

## System Architecture

This application follows a Next.js App Router architecture with these key components:

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, Shadcn/UI components
- **Backend**: Next.js API Routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom session-based authentication (JWT/HTTP-only cookies)
- **State Management**: Zustand for client-side state
- **API Integration**: GoShippo for shipping label services

## Key Business Concepts

### User Hierarchy
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

### Credit System
- Credits represent USD value for shipping labels (1 credit = $1.00)
- Credits flow down the hierarchy (Super Admin → Reseller → User)
- Users spend credits to purchase shipping labels
- All operations are recorded as transactions

## Developer Workflow

### Setup Instructions

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

### File Structure Conventions
- `/app/` - Next.js App Router pages and API routes
- `/components/` - React components grouped by feature
- `/lib/` - Shared utility functions and modules
- `/prisma/` - Database schema and migrations

## Critical Patterns

### Authentication & Authorization
Auth is implemented using custom session management with JWT tokens in HTTP-only cookies. Each API route must validate user permissions:

```typescript
// Example route handler with role protection
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check role permissions
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "RESELLER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // Continue with authorized operation...
}
```

### Database Access
All database operations use Prisma with proper query filtering for security:

```typescript
// Example: User data access pattern respecting hierarchy
async function getUsersByCreator(userId: string, userRole: string) {
  if (userRole === "SUPER_ADMIN") {
    // Super admin can see all users
    return prisma.user.findMany();
  } else if (userRole === "RESELLER") {
    // Resellers can only see their created users
    return prisma.user.findMany({
      where: { creatorId: userId }
    });
  } else {
    // Regular users can only see themselves
    return prisma.user.findMany({
      where: { id: userId }
    });
  }
}
```

### GoShippo API Integration
Integration with GoShippo API is centralized in `/lib/shippo.ts` with these key patterns:

```typescript
// Example of the GoShippo integration pattern
async function createShippingLabel(fromAddress, toAddress, parcel, userId) {
  // 1. Validate addresses through GoShippo
  // 2. Calculate shipping rates
  // 3. Verify user has sufficient credits
  // 4. Purchase label through GoShippo
  // 5. Record transaction and update credits
  // 6. Return label URL and tracking info
}
```

### Form Handling
Forms use React Hook Form with Zod validation:

```typescript
// Example form pattern
const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["RESELLER", "USER"])
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: "", email: "", role: "USER" }
});
```

## Testing Approach
- Unit tests with Jest for utility functions and business logic
- Component tests with React Testing Library
- API route tests with supertest
- Use mocks for GoShippo API in tests

## Common Issues & Solutions

### Credit Management
When implementing credit operations, always:
1. Check current balance before approving transactions
2. Use database transactions for multi-step operations
3. Record detailed audit trail in transactions table

### GoShippo API Limitations
- API has rate limits - implement request throttling
- Shipping rates expire after 10 minutes - handle refreshing
- Test with sandbox keys that support all required carriers

## Deployment
The application is deployed on Vercel with:
- Production database on managed PostgreSQL
- Environment variables for API keys and secrets
- Production GoShippo API key

## Reference Material
For more details, refer to the documentation in `/docs/`:
- `01-project-architecture.md` - System architecture and database schema
- `02-ui-ux-design.md` - UI components and design patterns
- `03-business-logic-requirements.md` - Business rules and validation
- `04-development-implementation-guide.md` - Development workflow

When implementing new features, ensure they align with the hierarchical permissions model and credit-based economy fundamental to the application's design.