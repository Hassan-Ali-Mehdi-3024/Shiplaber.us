import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, 
         eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

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

    // Define date range and interval based on period
    const today = new Date();
    let startDate, dateFormat, intervals;
    
    switch (period) {
      case 'week':
        startDate = subDays(today, 7);
        dateFormat = 'MM/dd';
        intervals = eachDayOfInterval({ start: startDate, end: today });
        break;
      case 'month':
        startDate = subMonths(today, 1);
        dateFormat = 'MM/dd';
        intervals = eachDayOfInterval({ start: startDate, end: today });
        break;
      case 'year':
        startDate = subYears(today, 1);
        dateFormat = 'MMM';
        intervals = eachMonthOfInterval({ start: startDate, end: today });
        break;
      default:
        startDate = subDays(today, 7);
        dateFormat = 'MM/dd';
        intervals = eachDayOfInterval({ start: startDate, end: today });
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
        id: true,
        createdAt: true
      }
    });

    // Generate data points
    let data;
    
    if (period === 'year') {
      // Group by month for year view
      data = intervals.map(date => {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const count = shipments.filter(shipment => {
          const shipmentDate = new Date(shipment.createdAt);
          return shipmentDate >= monthStart && shipmentDate <= monthEnd;
        }).length;
        
        return {
          date: format(date, dateFormat),
          value: count
        };
      });
    } else {
      // Group by day for week/month view
      data = intervals.map(date => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const count = shipments.filter(shipment => {
          const shipmentDate = new Date(shipment.createdAt);
          return shipmentDate >= dayStart && shipmentDate <= dayEnd;
        }).length;
        
        return {
          date: format(date, dateFormat),
          value: count
        };
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating shipping volume chart data:', error);
    return NextResponse.json({ error: 'Failed to generate chart data' }, { status: 500 });
  }
}