import { getSession, type SessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

// API route for getting users with role-based filtering
export async function GET(req: Request) {
  try {
    const session = await getSession(null);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;
    
    // Different queries based on user role
    let whereClause: any = { isActive: true };
    
    // Add search filter if provided
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    // Super Admin can see all users
    if (session.role !== 'SUPER_ADMIN') {
      if (session.role === 'RESELLER') {
        // Resellers can only see their created users and themselves
        whereClause.OR = [
          { id: session.id },
          { creatorId: session.id }
        ];
      } else {
        // Regular users can only see themselves
        whereClause.id = session.id;
      }
    }
    
    // Execute query with pagination
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        creditBalance: true,
        createdAt: true,
        isActive: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            createdUsers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Get total count for pagination
    const total = await prisma.user.count({
      where: whereClause
    });
    
    // Format the response to handle Decimal type correctly
    const formattedUsers = users.map(user => ({
      ...user,
      creditBalance: Number(user.creditBalance)
    }));
    
    return Response.json({
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// API route for creating new users
export async function POST(req: Request) {
  try {
    const session = await getSession(null);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only Super Admins and Resellers can create users
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'RESELLER') {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Validate input
    if (!data.name || !data.email || !data.password || !data.role) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Role validation based on creator's role
    if (session.role === 'RESELLER' && data.role === 'SUPER_ADMIN') {
      return Response.json({ error: "Resellers cannot create Super Admin users" }, { status: 403 });
    }
    
    if (session.role === 'RESELLER' && data.role === 'RESELLER') {
      return Response.json({ error: "Resellers cannot create other Resellers" }, { status: 403 });
    }
    
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      return Response.json({ error: "Email already in use" }, { status: 400 });
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        creditBalance: data.initialCredit ? parseFloat(data.initialCredit) : 0,
        creatorId: session.id,
        isActive: true
      }
    });
    
    // Create transaction record for initial credit if provided
    if (data.initialCredit && parseFloat(data.initialCredit) > 0) {
      await prisma.transaction.create({
        data: {
          userId: newUser.id,
          transactionType: 'CREDIT_ASSIGN',
          amount: parseFloat(data.initialCredit),
          description: 'Initial credit assignment',
          createdById: session.id
        }
      });
    }
    
    return Response.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        creditBalance: Number(newUser.creditBalance)
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}