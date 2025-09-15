import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Readable } from 'stream';
import { prisma } from '@/lib/db/prisma';
import { parse } from 'papaparse';

// Maximum CSV file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Process the form data to get the CSV file
async function extractFile(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return { error: 'Content type must be multipart/form-data' };
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return { error: 'No file provided' };
    }

    if (!file.name.endsWith('.csv')) {
      return { error: 'File must be a CSV' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { error: 'File size must be less than 5MB' };
    }

    const fileBuffer = await file.arrayBuffer();
    const fileString = new TextDecoder().decode(fileBuffer);
    
    return { 
      fileName: file.name,
      fileContent: fileString
    };
  } catch (error) {
    console.error('Error extracting file:', error);
    return { error: 'Failed to extract file from request' };
  }
}

// Validate CSV headers
function validateCSVHeaders(headers: string[]) {
  // Required headers for a valid shipment CSV
  const requiredHeaders = [
    'to_name', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country',
    'from_name', 'from_street1', 'from_city', 'from_state', 'from_zip', 'from_country',
    'length', 'width', 'height', 'weight', 'distance_unit', 'mass_unit'
  ];

  // Optional headers
  const optionalHeaders = [
    'to_company', 'to_street2', 'to_phone', 'to_email',
    'from_company', 'from_street2', 'from_phone', 'from_email',
    'reference', 'carrier', 'service_level'
  ];

  // Check if all required headers are present
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      valid: false,
      error: `Missing required headers: ${missingHeaders.join(', ')}`
    };
  }

  return { valid: true };
}

// Process the CSV batch
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract the file
    const fileData = await extractFile(request);
    if ('error' in fileData) {
      return NextResponse.json({ error: fileData.error }, { status: 400 });
    }

    // Parse the CSV
    const parseResult = parse(fileData.fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim()
    });

    // Validate the CSV headers
    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        error: "CSV parsing error",
        details: parseResult.errors[0].message
      }, { status: 400 });
    }

    // Validate headers
    const headerValidation = validateCSVHeaders(parseResult.meta.fields || []);
    if (!headerValidation.valid) {
      return NextResponse.json({ error: headerValidation.error }, { status: 400 });
    }

    // Create a new batch record
    const batch = await prisma.batch.create({
      data: {
        userId: session.user.id,
        filename: fileData.fileName,
        totalRows: parseResult.data.length,
        status: 'PROCESSING'
      }
    });

    // Start processing the batch asynchronously
    // We'll return the batch ID now and process in the background
    processBatchInBackground(batch.id, parseResult.data, session.user.id);

    return NextResponse.json({ 
      message: "Batch upload initiated successfully",
      batchId: batch.id,
      totalRows: parseResult.data.length
    });
  } catch (error) {
    console.error('Error processing batch:', error);
    return NextResponse.json({ error: 'Failed to process batch' }, { status: 500 });
  }
}

// Get batches for the current user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    
    // Query batches based on user role
    let batches;
    
    if (role === 'SUPER_ADMIN') {
      // Super admin can see all batches
      batches = await prisma.batch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } else if (role === 'RESELLER') {
      // Resellers can see batches from their created users
      const userIds = await prisma.user.findMany({
        where: { creatorId: userId },
        select: { id: true }
      });
      
      const userIdList = [userId, ...userIds.map((user: { id: string }) => user.id)];
      
      batches = await prisma.batch.findMany({
        where: {
          userId: { in: userIdList }
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } else {
      // Regular users can only see their own batches
      batches = await prisma.batch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    return NextResponse.json({ batches });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

// Function to process batch in background
async function processBatchInBackground(
  batchId: string, 
  rows: any[], 
  userId: string
) {
  const errorLogs: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    // Update batch status to processing
    await prisma.batch.update({
      where: { id: batchId },
      data: { status: 'PROCESSING' }
    });

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Format the row data into the format expected by the shippo API
        const shipmentData = {
          fromAddress: {
            name: row.from_name,
            company: row.from_company || '',
            street1: row.from_street1,
            street2: row.from_street2 || '',
            city: row.from_city,
            state: row.from_state,
            zip: row.from_zip,
            country: row.from_country,
            phone: row.from_phone || '',
            email: row.from_email || '',
          },
          toAddress: {
            name: row.to_name,
            company: row.to_company || '',
            street1: row.to_street1,
            street2: row.to_street2 || '',
            city: row.to_city,
            state: row.to_state,
            zip: row.to_zip,
            country: row.to_country,
            phone: row.to_phone || '',
            email: row.to_email || '',
          },
          parcel: {
            length: parseFloat(row.length),
            width: parseFloat(row.width),
            height: parseFloat(row.height),
            distance_unit: row.distance_unit,
            weight: parseFloat(row.weight),
            mass_unit: row.mass_unit,
          },
          carrier: row.carrier || undefined,
          serviceLevel: row.service_level || undefined,
          reference: row.reference || `Batch-${batchId}-Row-${i+1}`
        };

        // Create a shipment record in the database
        await prisma.shipment.create({
          data: {
            userId: userId,
            fromAddress: JSON.stringify(shipmentData.fromAddress),
            toAddress: JSON.stringify(shipmentData.toAddress),
            parcelDetails: JSON.stringify(shipmentData.parcel),
            carrier: shipmentData.carrier,
            serviceLevel: shipmentData.serviceLevel,
            status: 'PENDING',
          }
        });

        // Update batch with processed count
        await prisma.batch.update({
          where: { id: batchId },
          data: { 
            processedRows: { increment: 1 },
            successfulRows: { increment: 1 }
          }
        });

        successCount++;
      } catch (error) {
        // Log the error for this row
        const errorMsg = `Error in row ${i+1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorLogs.push(errorMsg);
        failedCount++;
        
        // Update batch with failed count
        await prisma.batch.update({
          where: { id: batchId },
          data: { 
            processedRows: { increment: 1 },
            failedRows: { increment: 1 }
          }
        });
      }
    }

    // Update batch as completed
    await prisma.batch.update({
      where: { id: batchId },
      data: { 
        status: failedCount > 0 ? (successCount > 0 ? 'COMPLETED' : 'FAILED') : 'COMPLETED',
        errorLog: errorLogs.length > 0 ? errorLogs.join('\n') : null,
        completedAt: new Date()
      }
    });

  } catch (error) {
    console.error(`Error processing batch ${batchId}:`, error);
    // Update batch as failed
    await prisma.batch.update({
      where: { id: batchId },
      data: { 
        status: 'FAILED',
        errorLog: `Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        completedAt: new Date()
      }
    });
  }
}