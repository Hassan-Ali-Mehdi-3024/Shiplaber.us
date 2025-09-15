import { prisma } from '@/lib/db/prisma';

interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  distance_unit: 'in' | 'cm';
  weight: number;
  mass_unit: 'lb' | 'kg';
}

// API key from environment variable
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;
const SHIPPO_API_URL = 'https://api.goshippo.com/v1';

// Error mapping for user-friendly messages
const shippoErrorMap: Record<string, string> = {
  // Address Validation Errors
  'INVALID_ADDRESS': 'Please verify the address and try again.',
  'UNDELIVERABLE_ADDRESS': 'This address cannot receive shipments.',
  'MISSING_STREET': 'Street address is required.',
  
  // Rate Calculation Errors
  'NO_RATES_AVAILABLE': 'No shipping options available for this route.',
  'WEIGHT_EXCEEDS_LIMIT': 'Package weight exceeds carrier limits.',
  'DIMENSIONS_INVALID': 'Package dimensions are invalid.',
  
  // Transaction Errors
  'INSUFFICIENT_FUNDS': 'Insufficient credits for this purchase.',
  'RATE_EXPIRED': 'Shipping rate has expired. Please recalculate.',
  'TRANSACTION_FAILED': 'Label purchase failed. Please try again.',
  
  // Refund Errors
  'REFUND_NOT_ELIGIBLE': 'This label is not eligible for refund.',
  'REFUND_EXPIRED': 'Refund period has expired.',
  'ALREADY_REFUNDED': 'This label has already been refunded.'
};

// Helper function for API requests
async function shippoFetch(endpoint: string, method: 'GET' | 'POST', data?: any) {
  try {
    const response = await fetch(`${SHIPPO_API_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    const result = await response.json();

    if (!response.ok) {
      // Map the error code to a user-friendly message
      let errorMessage = 'An error occurred with the shipping provider.';
      
      if (result.detail && shippoErrorMap[result.detail]) {
        errorMessage = shippoErrorMap[result.detail];
      }
      
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error('GoShippo API Error:', error);
    throw error;
  }
}

// Validate address through GoShippo
export async function validateAddress(address: Address) {
  return shippoFetch('/addresses/', 'POST', {
    ...address,
    validate: true
  });
}

// Get shipping rates
export async function getShippingRates(
  fromAddress: string, // Shippo Address ID
  toAddress: string, // Shippo Address ID
  parcel: Parcel
) {
  return shippoFetch('/shipments/', 'POST', {
    address_from: fromAddress,
    address_to: toAddress,
    parcels: [parcel],
    async: false
  });
}

// Purchase shipping label
export async function purchaseLabel(
  rateId: string,
  userId: string,
  labelFormat: 'PDF' | 'PNG' | 'ZPL' = 'PDF'
) {
  try {
    // 1. Get the user's credit balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, id: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Get rate information to verify cost
    const rate = await shippoFetch(`/rates/${rateId}/`, 'GET');
    const cost = parseFloat(rate.amount);

    // 3. Check if the user has enough credits
    if (parseFloat(user.creditBalance.toString()) < cost) {
      throw new Error('Insufficient credits. Please add more credits to your account.');
    }

    // 4. Purchase the label through GoShippo
    const transaction = await shippoFetch('/transactions/', 'POST', {
      rate: rateId,
      label_file_type: labelFormat,
      async: false
    });

    // 5. Record the transaction in our database
    await prisma.$transaction([
      // Create a shipment record
      prisma.shipment.create({
        data: {
          userId,
          shippoTransactionId: transaction.object_id,
          trackingNumber: transaction.tracking_number,
          labelUrl: transaction.label_url,
          cost,
          carrier: rate.provider,
          serviceLevel: rate.servicelevel.name,
          fromAddress: transaction.address_from,
          toAddress: transaction.address_to,
          parcelDetails: transaction.parcel,
          status: 'PURCHASED'
        }
      }),
      
      // Create a transaction record
      prisma.transaction.create({
        data: {
          userId,
          transactionType: 'LABEL_PURCHASE',
          amount: cost,
          description: `${rate.provider} - ${rate.servicelevel.name}`,
          referenceId: transaction.object_id,
          createdById: userId
        }
      }),
      
      // Update user's credit balance
      prisma.user.update({
        where: { id: userId },
        data: { creditBalance: { decrement: cost } }
      })
    ]);

    return transaction;
  } catch (error) {
    console.error('Label purchase error:', error);
    throw error;
  }
}

// Refund a shipping label
export async function refundLabel(
  transactionId: string,
  userId: string
) {
  try {
    // 1. Find the shipment in our database
    const shipment = await prisma.shipment.findFirst({
      where: {
        shippoTransactionId: transactionId,
        userId
      }
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    // 2. Request refund through GoShippo
    const refund = await shippoFetch('/refunds/', 'POST', {
      transaction: transactionId,
      async: false
    });

    // 3. If successful, update our records
    await prisma.$transaction([
      // Update shipment status
      prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: 'REFUNDED' }
      }),
      
      // Create a refund transaction
      prisma.transaction.create({
        data: {
          userId,
          transactionType: 'LABEL_REFUND',
          amount: shipment.cost || 0,
          description: 'Label refund',
          referenceId: refund.object_id,
          createdById: userId
        }
      }),
      
      // Return credits to user's balance
      prisma.user.update({
        where: { id: userId },
        data: { creditBalance: { increment: shipment.cost || 0 } }
      })
    ]);

    return refund;
  } catch (error) {
    console.error('Label refund error:', error);
    throw error;
  }
}