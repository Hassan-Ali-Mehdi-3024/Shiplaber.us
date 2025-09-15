import { cookies } from 'next/headers';

export async function GET() {
  cookies().delete('auth-token');
  
  return Response.json(
    { success: true },
    { status: 200 }
  );
}