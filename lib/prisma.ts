import { PrismaClient } from '@prisma/client';

// Create a single instance of Prisma Client to be reused across requests
const prisma = new PrismaClient();

export default prisma;