import { NextResponse } from 'next/server';

// This is a handler for the incorrect /api/users/assign endpoint
// It will redirect requests to the correct /api/credits/assign endpoint
export async function GET(req: Request) {
  console.log('Incorrect API endpoint accessed: /api/users/assign - Redirecting to /api/credits/assign');
  return NextResponse.redirect(new URL('/api/credits/assign', req.url));
}

export async function POST(req: Request) {
  console.log('Incorrect API endpoint accessed: /api/users/assign - Redirecting to /api/credits/assign');
  
  try {
    // Forward the POST request to the correct endpoint
    const body = await req.json();
    const response = await fetch(new URL('/api/credits/assign', req.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Return the response from the correct endpoint
    return response;
  } catch (error) {
    console.error('Error forwarding request:', error);
    return NextResponse.redirect(new URL('/api/credits/assign', req.url));
  }
}