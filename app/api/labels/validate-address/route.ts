import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { validateAddress } from '@/lib/shippo';
import { cookies } from 'next/headers';

// Validate an address with GoShippo
export async function POST(req: Request) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Accept the address directly or nested in address field
    const addressData = data.address || data;
    
    if (!addressData || !addressData.street1 || !addressData.city || !addressData.state || !addressData.zip) {
      return Response.json({ error: "Complete address data is required" }, { status: 400 });
    }
    
    const addressValidationResult = await validateAddress(addressData);
    
    return Response.json({
      success: true,
      validation: addressValidationResult
    });
    
  } catch (error) {
    console.error("Address validation error:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to validate address" 
    }, { status: 500 });
  }
}