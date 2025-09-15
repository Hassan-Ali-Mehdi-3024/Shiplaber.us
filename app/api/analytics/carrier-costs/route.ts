import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week';

    // Define date range based on period
    const today = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
    }

    // Get shipments in the period
    const shipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
        status: 'PURCHASED'
      },
      select: {
        carrier: true,
        cost: true
      }
    });

    // Group shipments by carrier with counts and costs
    const carrierData: Record<string, { shipments: number, cost: number }> = {};
    
    shipments.forEach(shipment => {
      const carrier = shipment.carrier || 'Unknown';
      const cost = shipment.cost ? Number(shipment.cost) : 0;
      
      if (!carrierData[carrier]) {
        carrierData[carrier] = { shipments: 0, cost: 0 };
      }
      
      carrierData[carrier].shipments += 1;
      carrierData[carrier].cost += cost;
    });

    // Transform into chart data format
    const data = Object.entries(carrierData).map(([name, data]) => ({
      name,
      shipments: data.shipments,
      cost: parseFloat(data.cost.toFixed(2))
    }));

    // Sort by shipment count descending
    data.sort((a, b) => b.shipments - a.shipments);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating carrier costs chart data:', error);
    return NextResponse.json({ error: 'Failed to generate chart data' }, { status: 500 });
  }
}