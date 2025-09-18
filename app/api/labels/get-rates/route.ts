import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getShippingRates } from '@/lib/shippo';
import { cookies } from 'next/headers';

// Get shipping rates based on from/to addresses and parcel details
export async function POST(req: Request) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Validate required data
    if (!data.fromAddress || !data.toAddress || !data.parcel) {
      return Response.json({ 
        error: "From address, to address, and parcel details are required" 
      }, { status: 400 });
    }
    
    console.log('Getting rates for:', {
      from: data.fromAddress,
      to: data.toAddress,
      parcel: data.parcel
    });
    
    const rates = await getShippingRates(
      data.fromAddress,
      data.toAddress,
      data.parcel
    );
    
    console.log('Received rates:', rates);
    
    // Ensure rates is always an array
    const ratesArray = Array.isArray(rates) ? rates : [];
    
    return Response.json({
      success: true,
      rates: ratesArray
    });
    
  } catch (error) {
    console.error("Error getting shipping rates:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to get shipping rates" 
    }, { status: 500 });
  }
}