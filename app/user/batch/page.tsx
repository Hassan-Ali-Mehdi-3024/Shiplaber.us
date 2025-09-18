import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserBatchClient from './page-client';

export default async function UserBatchPage() {
  const session = await getSession(null);
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'USER') {
    redirect('/dashboard');
  }
  
  return (
    <UserBatchClient session={session} />
  );
}