import { getSession } from '@/lib/auth';
import Link from 'next/link';

export default async function AuthTestPage() {
  const session = await getSession(null);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      {session ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p><strong>Authenticated as:</strong> {session.name}</p>
          <p><strong>Email:</strong> {session.email}</p>
          <p><strong>Role:</strong> {session.role}</p>
          <p><strong>Credit Balance:</strong> ${session.creditBalance.toFixed(2)}</p>
        </div>
      ) : (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>Not authenticated</p>
        </div>
      )}
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Routes:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin" className="bg-purple-600 text-white p-3 rounded text-center hover:bg-purple-700">
            Admin Dashboard
          </Link>
          <Link href="/reseller" className="bg-blue-600 text-white p-3 rounded text-center hover:bg-blue-700">
            Reseller Dashboard
          </Link>
          <Link href="/user" className="bg-green-600 text-white p-3 rounded text-center hover:bg-green-700">
            User Dashboard
          </Link>
          <Link href="/dashboard" className="bg-gray-600 text-white p-3 rounded text-center hover:bg-gray-700">
            Legacy Dashboard
          </Link>
        </div>
        
        {!session && (
          <div className="mt-6">
            <Link href="/login" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}