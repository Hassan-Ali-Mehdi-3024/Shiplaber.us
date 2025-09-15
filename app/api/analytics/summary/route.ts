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

    // Calculate summary metrics
    // Get shipments in the period
    const shipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
        status: 'PURCHASED'
      },
      select: {
        id: true,
        cost: true,
        userId: true
      }
    });

    // Calculate totals
    const totalShipments = shipments.length;
    const totalCreditsSpent = shipments.reduce((sum, shipment) => 
      sum + (shipment.cost ? Number(shipment.cost) : 0), 0);
    const avgShipmentCost = totalShipments > 0 ? totalCreditsSpent / totalShipments : 0;

    // Count unique users who created shipments
    const uniqueUserIds = new Set(shipments.map(s => s.userId));
    const activeUsers = uniqueUserIds.size;

    return NextResponse.json({
      totalShipments,
      totalCreditsSpent,
      avgShipmentCost,
      activeUsers
    });
  } catch (error) {
    console.error('Error generating analytics summary:', error);
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
  }
}