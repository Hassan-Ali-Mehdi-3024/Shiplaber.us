import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { purchaseLabel } from '@/lib/shippo';
import { cookies } from 'next/headers';

// Purchase a shipping label
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
    if (!data.rateId) {
      return Response.json({ error: "Rate ID is required" }, { status: 400 });
    }
    
    // Optional format parameter with default
    const labelFormat = data.labelFormat || 'PDF';
    
    if (!['PDF', 'PNG', 'ZPL'].includes(labelFormat)) {
      return Response.json({ error: "Invalid label format" }, { status: 400 });
    }
    
    const transaction = await purchaseLabel(
      data.rateId,
      session.id,
      labelFormat as 'PDF' | 'PNG' | 'ZPL'
    );
    
    return Response.json({
      success: true,
      transaction
    });
    
  } catch (error) {
    console.error("Error purchasing label:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to purchase label" 
    }, { status: 500 });
  }
}