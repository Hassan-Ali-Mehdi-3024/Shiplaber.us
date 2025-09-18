'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Package, 
  History,
  LogOut,
  FileSpreadsheet,
  BarChart
} from 'lucide-react';

// Helper function to get base route based on current path or role
function getBaseRoute(pathname: string, userRole: string): string {
  // If we're already on a role-specific route, use that
  if (pathname.startsWith('/admin')) return '/admin';
  if (pathname.startsWith('/reseller')) return '/reseller';
  if (pathname.startsWith('/user')) return '/user';
  
  // Otherwise, determine based on user role
  switch (userRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'RESELLER':
      return '/reseller';
    case 'USER':
      return '/user';
    default:
      return '/dashboard'; // Fallback
  }
}

// Define navigation items with their role access
const getNavigationItems = (baseRoute: string) => [
  { 
    name: 'Dashboard', 
    href: baseRoute, 
    icon: LayoutDashboard, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'RESELLER', 'USER'] 
  },
  { 
    name: 'Users', 
    href: `${baseRoute}/users`, 
    icon: Users, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'RESELLER'] 
  },
  { 
    name: 'Credits', 
    href: `${baseRoute}/credits`, 
    icon: CreditCard, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'RESELLER', 'USER'] 
  },
  { 
    name: 'Shipping Labels', 
    href: `${baseRoute}/labels`, 
    icon: Package, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'RESELLER', 'USER'] 
  },
  { 
    name: 'Batch Processing', 
    href: `${baseRoute}/batch`, 
    icon: FileSpreadsheet, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'RESELLER', 'USER'] 
  },
  { 
    name: 'Analytics', 
    href: `${baseRoute}/analytics`, 
    icon: BarChart, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'RESELLER'] 
  },
  { 
    name: 'History', 
    href: `${baseRoute}/history`, 
    icon: History, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'RESELLER', 'USER'] 
  },
];

export function RoleBasedNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('USER');
  const [loading, setLoading] = useState(true);
  
  // Fetch the user's role
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.user) {
          setUserRole(data.user.role);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
  }, []);

  // Don't render until we have the user role
  if (loading) {
    return (
      <nav className="flex flex-1 flex-col">
        <div className="animate-pulse space-y-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </nav>
    );
  }

  const baseRoute = getBaseRoute(pathname, userRole);
  const navigation = getNavigationItems(baseRoute);

  return (
    <nav className="flex flex-1 flex-col">
      <ul className="flex flex-1 flex-col gap-y-2">
        <li>
          <ul className="space-y-1">
            {navigation.map((item) => {
              // Only show navigation items that the user has access to based on their role
              if (!item.roles.includes(userRole)) {
                return null;
              }
              
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={`
                      group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium
                      ${isActive 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                    `}
                  >
                    <item.icon 
                      className={`h-5 w-5 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'}`} 
                      aria-hidden="true" 
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
        <li className="mt-auto">
          <Link
            href="/api/auth/logout"
            className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <LogOut className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-900" aria-hidden="true" />
            Sign Out
          </Link>
        </li>
      </ul>
    </nav>
  );
}