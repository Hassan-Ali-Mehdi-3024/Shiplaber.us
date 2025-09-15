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
        toAddress: true
      }
    });

    // Count shipments per destination (by state/country)
    const destinationCounts: Record<string, number> = {};
    
    shipments.forEach(shipment => {
      const address = shipment.toAddress as any;
      let destination = 'Unknown';
      
      if (address && address.state && address.country) {
        // For US destinations, use state; for international, use country
        if (address.country === 'US') {
          destination = address.state;
        } else {
          destination = address.country;
        }
        
        destinationCounts[destination] = (destinationCounts[destination] || 0) + 1;
      }
    });

    // Transform into chart data format
    const data = Object.entries(destinationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Get top 10 destinations

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating top destinations chart data:', error);
    return NextResponse.json({ error: 'Failed to generate chart data' }, { status: 500 });
  }
}