import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    // Get batch details
    const batch = await prisma.batch.findUnique({
      where: { id }
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Check if user has permission to view this batch
    // Admins and resellers can see batches of their created users
    let hasPermission = false;
    
    if (batch.userId === session.user.id) {
      // User owns this batch
      hasPermission = true;
    } else if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all batches
      hasPermission = true;
    } else if (session.user.role === 'RESELLER') {
      // Check if the batch owner is created by this reseller
      const batchOwner = await prisma.user.findUnique({
        where: { id: batch.userId },
        select: { creatorId: true }
      });
      
      if (batchOwner && batchOwner.creatorId === session.user.id) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the shipments created from this batch
    const shipments = await prisma.shipment.findMany({
      where: {
        userId: batch.userId,
        createdAt: {
          // Find shipments created around the same time as the batch
          gte: new Date(batch.createdAt.getTime() - 5000), // 5 seconds before
          lte: batch.completedAt || new Date() // Now or completion time
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to first 100 shipments
      select: {
        id: true,
        trackingNumber: true,
        labelUrl: true,
        status: true,
        cost: true,
        createdAt: true,
        toAddress: true,
        carrier: true,
        serviceLevel: true
      }
    });

    return NextResponse.json({
      batch: {
        id: batch.id,
        filename: batch.filename,
        totalRows: batch.totalRows,
        processedRows: batch.processedRows,
        successfulRows: batch.successfulRows,
        failedRows: batch.failedRows,
        status: batch.status,
        errorLog: batch.errorLog,
        createdAt: batch.createdAt,
        completedAt: batch.completedAt,
      },
      shipments
    });
  } catch (error) {
    console.error('Error getting batch:', error);
    return NextResponse.json({ error: 'Failed to get batch details' }, { status: 500 });
  }
}