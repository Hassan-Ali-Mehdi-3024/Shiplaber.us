import * as runtime from '@prisma/client/runtime/library.js';
import { PrismaClient } from '.prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clean up existing data
    await prisma.shipment.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.batch.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Database cleaned');

    // Create Super Admin user
    const superAdminPassword = await bcrypt.hash('admin123', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@example.com',
        passwordHash: superAdminPassword,
        role: 'SUPER_ADMIN',
        creditBalance: 10000,
        isActive: true
      }
    });

    console.log(`Created Super Admin: ${superAdmin.email}`);

    // Create a Reseller user
    const resellerPassword = await bcrypt.hash('reseller123', 10);
    
    const reseller = await prisma.user.create({
      data: {
        name: 'Test Reseller',
        email: 'reseller@example.com',
        passwordHash: resellerPassword,
        role: 'RESELLER',
        creditBalance: 1000,
        creatorId: superAdmin.id,
        isActive: true
      }
    });

    console.log(`Created Reseller: ${reseller.email}`);

    // Create a regular User
    const userPassword = await bcrypt.hash('user123', 10);
    
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'user@example.com',
        passwordHash: userPassword,
        role: 'USER',
        creditBalance: 100,
        creatorId: reseller.id,
        isActive: true
      }
    });

    console.log(`Created User: ${user.email}`);

    // Create some sample transactions
    await prisma.transaction.create({
      data: {
        userId: reseller.id,
        createdById: superAdmin.id,
        transactionType: 'CREDIT_ASSIGN',
        amount: 1000,
        description: 'Initial credit assignment'
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        createdById: reseller.id,
        transactionType: 'CREDIT_ASSIGN',
        amount: 100,
        description: 'Initial credit assignment'
      }
    });

    console.log('Created sample transactions');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();