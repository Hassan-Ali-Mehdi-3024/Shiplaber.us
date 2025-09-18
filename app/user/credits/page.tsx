import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function UserCreditsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/user" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">My Credits & Balance</h1>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            User Credit Management
          </h2>
          <p className="text-gray-600 mb-6">
            This page will contain the user version of credit and balance management.
          </p>
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              <p>• View current credit balance</p>
              <p>• Review transaction history</p>
              <p>• Track credit usage patterns</p>
              <p>• Request additional credits from reseller</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              This page will be fully implemented in the next phase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}