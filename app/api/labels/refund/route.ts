import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { refundLabel } from '@/lib/shippo';
import { cookies } from 'next/headers';

// Request a refund for a shipping label
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
    if (!data.transactionId) {
      return Response.json({ error: "Transaction ID is required" }, { status: 400 });
    }
    
    // Check if the shipment belongs to this user or is accessible to admin/reseller
    const shipment = await prisma.shipment.findFirst({
      where: {
        shippoTransactionId: data.transactionId
      }
    });
    
    if (!shipment) {
      return Response.json({ error: "Shipment not found" }, { status: 404 });
    }
    
    // Only allow refund for own shipments, or if super admin
    if (shipment.userId !== session.id && session.role !== 'SUPER_ADMIN') {
      // Check if reseller has access to this user's shipments
      if (session.role === 'RESELLER') {
        const user = await prisma.user.findUnique({
          where: { id: shipment.userId }
        });
        
        if (!user || user.creatorId !== session.id) {
          return Response.json({ error: "You don&apos;t have permission to refund this label" }, { status: 403 });
        }
      } else {
        return Response.json({ error: "You don&apos;t have permission to refund this label" }, { status: 403 });
      }
    }
    
    const refund = await refundLabel(
      data.transactionId,
      shipment.userId
    );
    
    return Response.json({
      success: true,
      refund
    });
    
  } catch (error) {
    console.error("Error requesting refund:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to request refund" 
    }, { status: 500 });
  }
}