import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

// Get detailed information about a specific shipment
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const shipmentId = params.id;
    
    if (!shipmentId) {
      return Response.json({ error: "Shipment ID is required" }, { status: 400 });
    }
    
    // Find the shipment
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    });
    
    if (!shipment) {
      return Response.json({ error: "Shipment not found" }, { status: 404 });
    }
    
    // Check permissions to view this shipment
    if (shipment.userId !== session.id) {
      if (session.role === 'SUPER_ADMIN') {
        // Super admins can view any shipment
      } else if (session.role === 'RESELLER') {
        // Check if reseller created the user who owns this shipment
        const user = await prisma.user.findUnique({
          where: { id: shipment.userId }
        });
        
        if (!user || user.creatorId !== session.id) {
          return Response.json({ error: "You don't have permission to view this shipment" }, { status: 403 });
        }
      } else {
        // Regular users can only view their own shipments
        return Response.json({ error: "You don't have permission to view this shipment" }, { status: 403 });
      }
    }
    
    // Get associated transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        referenceId: shipment.shippoTransactionId,
        OR: [
          { transactionType: 'LABEL_PURCHASE' },
          { transactionType: 'LABEL_REFUND' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return Response.json({
      shipment,
      transactions
    });
    
  } catch (error) {
    console.error("Error fetching shipment details:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch shipment details" 
    }, { status: 500 });
  }
}