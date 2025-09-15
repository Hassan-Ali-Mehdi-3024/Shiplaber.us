# UI/UX Design Documentation
## Shipping Label Management System

### Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Component Architecture](#component-architecture)
3. [Navigation Structure](#navigation-structure)
4. [User Interface Layouts](#user-interface-layouts)
5. [User Experience Flows](#user-experience-flows)
6. [Responsive Design](#responsive-design)
7. [Design System](#design-system)
8. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles
- **Clarity**: Clean, intuitive interfaces that minimize user confusion
- **Efficiency**: Streamlined workflows for repetitive shipping tasks
- **Consistency**: Uniform design patterns across all user roles
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Scalability**: Design system that supports future feature additions

### Visual Design Goals
- Professional appearance suitable for business use
- Minimal cognitive load with clear visual hierarchy
- Fast loading and responsive across all devices
- Modern, clean aesthetic with purposeful use of color

---

## Component Architecture

### Component Hierarchy
```
App Layout
├── Navigation
│   ├── Sidebar
│   │   ├── SidebarItem
│   │   ├── SidebarGroup
│   │   └── SidebarToggle
│   └── TopBar
│       ├── UserMenu
│       └── NotificationBadge
├── Main Content
│   ├── PageHeader
│   ├── ContentArea
│   └── ActionPanel
└── Shared Components
    ├── Forms
    │   ├── Input
    │   ├── Select
    │   ├── Button
    │   ├── FormField
    │   └── FormSection
    ├── Data Display
    │   ├── Table
    │   ├── Card
    │   ├── Badge
    │   ├── Modal
    │   └── Toast
    └── Navigation
        ├── Breadcrumb
        ├── Pagination
        └── Tabs
```

### Core Components Specification

#### Layout Components

**AppLayout**
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  user: User;
  sidebarCollapsed?: boolean;
}
```
- Provides the main application structure
- Handles responsive layout adjustments
- Manages sidebar state

**Sidebar**
```typescript
interface SidebarProps {
  userRole: 'SUPER_ADMIN' | 'RESELLER' | 'USER';
  currentPath: string;
  collapsed: boolean;
  onToggle: () => void;
}
```
- Dynamic navigation based on user role
- Collapsible for mobile and user preference
- Active state indication

#### Form Components

**Button**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Input**
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number';
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}
```

**Select**
```typescript
interface SelectProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}
```

#### Data Components

**Table**
```typescript
interface TableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    sortable?: boolean;
  }>;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  loading?: boolean;
}
```

**Modal**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  actions?: React.ReactNode;
}
```

---

## Navigation Structure

### Sidebar Navigation by Role

#### Super Admin Sidebar
```
🏠 Dashboard
📢 Announcements (Coming Soon)
🚛 USPS (Scan sheet) (Coming Soon)
🏷️ Order Label
📋 Bulk Order Label
📜 Orders History
📦 Download Batches
👥 Manage Dealers
👤 Account Services (Coming Soon)
↩️ Return Package Settings (Coming Soon)
🔌 API (Coming Soon)
📊 Inventory (Coming Soon)
🛒 Walmart Account (Coming Soon)
📱 Amazon Purchase List (Coming Soon)
📈 Amazon PNL (Coming Soon)
🚪 Logout
```

#### Reseller Sidebar
```
🏠 Dashboard
📢 Announcements (Coming Soon)
🚛 USPS (Scan sheet) (Coming Soon)
🏷️ Order Label
📋 Bulk Order Label
📜 Orders History
📦 Download Batches
👥 Manage Users
👤 Account Services (Coming Soon)
↩️ Return Package Settings (Coming Soon)
🔌 API (Coming Soon)
📊 Inventory (Coming Soon)
🛒 Walmart Account (Coming Soon)
📱 Amazon Purchase List (Coming Soon)
📈 Amazon PNL (Coming Soon)
🚪 Logout
```

#### User Sidebar
```
🏠 Dashboard
📢 Announcements (Coming Soon)
🚛 USPS (Scan sheet) (Coming Soon)
🏷️ Order Label
📋 Bulk Order Label
📜 Orders History
📦 Download Batches
👤 Account Services (Coming Soon)
↩️ Return Package Settings (Coming Soon)
🔌 API (Coming Soon)
📊 Inventory (Coming Soon)
🛒 Walmart Account (Coming Soon)
📱 Amazon Purchase List (Coming Soon)
📈 Amazon PNL (Coming Soon)
🚪 Logout
```

### "Coming Soon" Interaction
- Clickable items show modal: "This feature is coming soon!"
- Modal includes estimated availability (if known)
- Option to "Get Notified" for future updates

---

## User Interface Layouts

### Login Page Layout
```
┌─────────────────────────────────────────┐
│              [LOGO]                     │
│                                         │
│         Shipping Label System           │
│                                         │
│    ┌─────────────────────────────┐     │
│    │        Login Form           │     │
│    │  ┌─────────────────────┐   │     │
│    │  │ Email               │   │     │
│    │  └─────────────────────┘   │     │
│    │  ┌─────────────────────┐   │     │
│    │  │ Password            │   │     │
│    │  └─────────────────────┘   │     │
│    │  [Login Button]            │     │
│    │                            │     │
│    │  Having trouble logging in?│     │
│    │  Contact your provider.    │     │
│    └─────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### Dashboard Layout
```
┌─────────┬─────────────────────────────────┐
│         │ Dashboard                       │
│ Sidebar ├─────────────────────────────────┤
│         │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│         │ │Stat1│ │Stat2│ │Stat3│ │Stat4││
│         │ └─────┘ └─────┘ └─────┘ └─────┘│
│         │                                │
│         │ Recent Activity                │
│         │ ┌─────────────────────────────┐│
│         │ │                             ││
│         │ │    Activity Table           ││
│         │ │                             ││
│         │ └─────────────────────────────┘│
│         │                                │
│         │ Quick Actions                  │
│         │ [Create Label] [Upload CSV]    │
└─────────┴─────────────────────────────────┘
```

### Form Layout (Label Creation)
```
┌─────────┬─────────────────────────────────┐
│         │ Create Shipping Label           │
│ Sidebar ├─────────────────────────────────┤
│         │ ┌─── Step 1: Addresses ────────┐│
│         │ │ From Address                 ││
│         │ │ [Name] [Company]             ││
│         │ │ [Address] [City] [State] [Zip]││
│         │ │                              ││
│         │ │ To Address                   ││
│         │ │ [Name] [Company]             ││
│         │ │ [Address] [City] [State] [Zip]││
│         │ └──────────────────────────────┘│
│         │                                │
│         │ ┌─── Step 2: Package ──────────┐│
│         │ │ [Weight] [Length] [Width]    ││
│         │ │ [Height] [Package Type]      ││
│         │ └──────────────────────────────┘│
│         │                                │
│         │ ┌─── Step 3: Service ──────────┐│
│         │ │ Available Rates:             ││
│         │ │ ○ USPS Priority - $8.50      ││
│         │ │ ○ UPS Ground - $12.30        ││
│         │ │ ○ FedEx 2Day - $18.90        ││
│         │ └──────────────────────────────┘│
│         │                                │
│         │ [Previous] [Purchase Label]    │
└─────────┴─────────────────────────────────┘
```

### Table Layout (History/Management)
```
┌─────────┬─────────────────────────────────┐
│         │ Orders History                  │
│ Sidebar ├─────────────────────────────────┤
│         │ Filters: [Date] [Status] [Search]│
│         │ ┌─────────────────────────────────┐│
│         │ │Date    │Tracking│Recipient│Cost││
│         │ ├─────────────────────────────────┤│
│         │ │12/13/24│9400...│John Doe │$8.50││
│         │ │12/12/24│9401...│Jane S.  │$6.20││
│         │ │12/11/24│9402...│Bob M.   │$4.30││
│         │ └─────────────────────────────────┘│
│         │ [< Previous] Page 1 of 5 [Next >]│
└─────────┴─────────────────────────────────┘
```

---

## User Experience Flows

### Label Creation Flow
```
1. User clicks "Order Label"
   ↓
2. Step 1: Address Entry
   - Auto-complete for addresses
   - Address validation
   - Save to address book option
   ↓
3. Step 2: Package Details
   - Preset package types
   - Weight/dimension validation
   - Package calculator helper
   ↓
4. Step 3: Service Selection
   - Real-time rate comparison
   - Delivery time estimates
   - Cost display with user's credit balance
   ↓
5. Confirmation & Purchase
   - Review all details
   - Credit deduction confirmation
   - Label generation and download
```

### Bulk Upload Flow
```
1. User clicks "Bulk Order Label"
   ↓
2. Template Download (Optional)
   - Download CSV template
   - View example data
   ↓
3. File Upload
   - Drag & drop interface
   - File validation
   - Preview of parsed data
   ↓
4. Background Processing
   - Progress indicator
   - Real-time status updates
   - Error handling display
   ↓
5. Results & Download
   - Success/failure summary
   - Individual label downloads
   - Error report download
```

### User Management Flow (Admin/Reseller)
```
1. Navigate to "Manage Users/Dealers"
   ↓
2. User List Display
   - Searchable table
   - Filter by status/role
   - Sort by various columns
   ↓
3. Create New User
   - Modal form
   - Role assignment
   - Initial credit assignment
   ↓
4. Manage Existing User
   - Edit user details
   - Change password
   - Adjust credit balance
   - View user's activity
```

### Credit Management Flow
```
1. Access user's credit panel
   ↓
2. Current Balance Display
   - Available credits
   - Recent transactions
   - Usage trends
   ↓
3. Credit Operations
   - Assign credits (with confirmation)
   - Revoke credits (with reason)
   - View transaction history
   ↓
4. Transaction Confirmation
   - Success/error feedback
   - Updated balance display
   - Transaction record creation
```

---

## Responsive Design

### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large Desktop**: 1440px+

### Mobile Adaptations

#### Sidebar Navigation
- Collapses to hamburger menu
- Overlay mode on small screens
- Touch-friendly tap targets (44px minimum)

#### Form Layouts
- Single column layout
- Larger touch targets
- Simplified multi-step processes
- Floating action buttons for primary actions

#### Table Displays
- Horizontal scrolling with sticky columns
- Card layout for complex data
- Expandable rows for details

#### Dashboard Metrics
- Stacked metric cards
- Simplified charts and graphs
- Priority information highlighted

---

## Design System

### Color Palette
```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;   /* Primary brand color */
--primary-600: #2563eb;   /* Hover states */
--primary-700: #1d4ed8;   /* Active states */

/* Neutral Colors */
--gray-50: #f9fafb;       /* Light backgrounds */
--gray-100: #f3f4f6;      /* Card backgrounds */
--gray-200: #e5e7eb;      /* Borders */
--gray-500: #6b7280;      /* Text secondary */
--gray-700: #374151;      /* Text primary */
--gray-900: #111827;      /* Headers */

/* Status Colors */
--success: #10b981;       /* Success states */
--warning: #f59e0b;       /* Warning states */
--error: #ef4444;         /* Error states */
--info: #06b6d4;          /* Info states */
```

### Typography Scale
```css
/* Font Families */
--font-sans: 'Inter', sans-serif;    /* UI text */
--font-mono: 'JetBrains Mono', monospace; /* Code/data */

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System
```css
/* Spacing Scale (based on 4px units) */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Component Variants

#### Button Variants
```typescript
// Primary - main actions
variant: 'primary'
// Secondary - supporting actions  
variant: 'secondary'
// Outline - less prominent actions
variant: 'outline'
// Ghost - minimal styling
variant: 'ghost'
// Destructive - dangerous actions
variant: 'destructive'
```

#### Input States
```typescript
// Default state
state: 'default'
// Focus state
state: 'focus'
// Error state (with error message)
state: 'error'
// Disabled state
state: 'disabled'
```

### Icon System
- **Library**: Lucide React icons
- **Sizes**: 16px, 20px, 24px, 32px
- **Style**: Consistent stroke width (1.5px)
- **Usage**: Semantic meaning with text labels

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color & Contrast
- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text
- Never rely on color alone to convey information

#### Keyboard Navigation
- All interactive elements accessible via keyboard
- Logical tab order throughout the application
- Visible focus indicators on all focusable elements
- Skip links for main content areas

#### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy (h1, h2, h3, etc.)
- Alt text for all meaningful images
- ARIA labels for complex components
- Form labels properly associated with inputs

#### Interactive Elements
- Touch targets minimum 44x44px
- Hover and focus states clearly indicated
- Error messages clearly associated with form fields
- Loading states announced to screen readers

### Accessibility Features

#### Form Accessibility
```typescript
// Proper labeling
<label htmlFor="email">Email Address</label>
<input 
  id="email" 
  type="email" 
  required
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  {error && error}
</div>
```

#### Table Accessibility
```typescript
<table role="table" aria-label="Shipping History">
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Tracking Number</th>
      <th scope="col">Cost</th>
    </tr>
  </thead>
  <tbody>
    {/* table rows */}
  </tbody>
</table>
```

#### Modal Accessibility
```typescript
<div 
  role="dialog" 
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Purchase</h2>
  <p id="modal-description">
    This will create a shipping label for $8.50
  </p>
</div>
```

---

## Animation & Micro-interactions

### Animation Principles
- **Purposeful**: Animations should provide feedback or guide attention
- **Fast**: Keep animations under 300ms for UI feedback
- **Respectful**: Honor `prefers-reduced-motion` settings
- **Consistent**: Use the same easing and timing across similar interactions

### Common Animations
- **Page Transitions**: Smooth fade-in (200ms)
- **Modal Appearance**: Scale in from center (250ms)
- **Button Interactions**: Subtle scale on press (100ms)
- **Form Validation**: Shake animation for errors (400ms)
- **Loading States**: Skeleton screens and spinners

### State Transitions
```css
/* Button hover state */
.button {
  transition: all 0.2s ease-in-out;
}

/* Modal entrance */
.modal-enter {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: opacity 250ms, transform 250ms;
}
```

---

This design documentation provides a comprehensive guide for implementing a consistent, accessible, and user-friendly interface across all user roles and features in the shipping label management system.