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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'RESELLER', 'USER'] },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['SUPER_ADMIN', 'RESELLER'] },
  { name: 'Credits', href: '/dashboard/credits', icon: CreditCard, roles: ['SUPER_ADMIN', 'RESELLER', 'USER'] },
  { name: 'Shipping Labels', href: '/dashboard/labels', icon: Package, roles: ['SUPER_ADMIN', 'RESELLER', 'USER'] },
  { name: 'Batch Processing', href: '/dashboard/batch', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'RESELLER', 'USER'] },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart, roles: ['SUPER_ADMIN', 'RESELLER'] },
  { name: 'History', href: '/dashboard/history', icon: History, roles: ['SUPER_ADMIN', 'RESELLER', 'USER'] },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('USER');
  
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
      }
    };
    
    fetchSession();
  }, []);

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
            href="/api/auth/signout"
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