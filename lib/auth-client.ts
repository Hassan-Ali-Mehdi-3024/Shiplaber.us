// Client-side utility functions for auth
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'RESELLER' | 'USER';

// Get role-specific route for redirects (client-side version)
export function getRoleBasedRoute(role: UserRole | string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'RESELLER':
      return '/reseller';
    case 'USER':
      return '/user';
    default:
      return '/dashboard'; // Fallback to existing dashboard
  }
}