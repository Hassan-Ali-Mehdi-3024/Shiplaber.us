import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession(null);

  if (!session) {
    return Response.json({ user: null }, { status: 200 });
  }

  return Response.json({ user: session }, { status: 200 });
}