import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ResellerBatchClient from './page-client';

export default async function ResellerBatchPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'RESELLER') {
    redirect('/dashboard');
  }
  
  return (
    <ResellerBatchClient session={session} />
  );
}