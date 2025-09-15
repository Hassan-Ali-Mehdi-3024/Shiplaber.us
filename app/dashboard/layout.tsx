import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession(null);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 pt-5 pb-4 flex flex-col">
        <div className="px-6">
          <h2 className="text-lg font-semibold text-gray-900">Shipping Label App</h2>
        </div>
        <div className="mt-6 flex-grow flex flex-col">
          <DashboardNav />
        </div>
        <div className="px-6 pt-4 pb-2 border-t border-gray-200">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">{session.name}</p>
              <p className="text-xs text-gray-500">{session.role}</p>
              <p className="text-xs font-medium text-primary-700">Credits: ${session.creditBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}