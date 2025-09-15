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

    // Get shipments for spent credits
    const shipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
        status: 'PURCHASED'
      },
      select: {
        cost: true,
        createdAt: true
      }
    });

    // Get credit assignments for allocated credits
    const creditAssignments = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
        transactionType: 'CREDIT_ASSIGN'
      },
      select: {
        amount: true,
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
        
        const totalSpent = shipments
          .filter(shipment => {
            const shipmentDate = new Date(shipment.createdAt);
            return shipmentDate >= monthStart && shipmentDate <= monthEnd;
          })
          .reduce((sum, shipment) => sum + (shipment.cost ? Number(shipment.cost) : 0), 0);

        const totalAllocated = creditAssignments
          .filter(transaction => {
            const transactionDate = new Date(transaction.createdAt);
            return transactionDate >= monthStart && transactionDate <= monthEnd;
          })
          .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
        
        return {
          date: format(date, dateFormat),
          spent: parseFloat(totalSpent.toFixed(2)),
          allocated: parseFloat(totalAllocated.toFixed(2))
        };
      });
    } else {
      // Group by day for week/month view
      data = intervals.map(date => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const totalSpent = shipments
          .filter(shipment => {
            const shipmentDate = new Date(shipment.createdAt);
            return shipmentDate >= dayStart && shipmentDate <= dayEnd;
          })
          .reduce((sum, shipment) => sum + (shipment.cost ? Number(shipment.cost) : 0), 0);

        const totalAllocated = creditAssignments
          .filter(transaction => {
            const transactionDate = new Date(transaction.createdAt);
            return transactionDate >= dayStart && transactionDate <= dayEnd;
          })
          .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
        
        return {
          date: format(date, dateFormat),
          spent: parseFloat(totalSpent.toFixed(2)),
          allocated: parseFloat(totalAllocated.toFixed(2))
        };
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating credit allocation chart data:', error);
    return NextResponse.json({ error: 'Failed to generate chart data' }, { status: 500 });
  }
}