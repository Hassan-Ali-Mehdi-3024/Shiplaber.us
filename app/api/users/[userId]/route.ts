import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

// Get user by ID
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only super admin can view any user
    // Users and resellers can only view themselves
    if (session.role !== 'SUPER_ADMIN' && session.id !== params.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        creditBalance: true,
        isActive: true,
        createdAt: true,
        emailNotifications: true,
        marketingEmails: true
      }
    });
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    return Response.json(user);
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch user" 
    }, { status: 500 });
  }
}

// Update user information
export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession({
      cookies: () => cookies()
    } as any);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only super admin can update any user
    // Users and resellers can only update themselves
    if (session.role !== 'SUPER_ADMIN' && session.id !== params.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const data = await req.json();
    const { name, email } = data;
    
    // Basic validation
    if (!name || !email) {
      return Response.json({ error: "Name and email are required" }, { status: 400 });
    }
    
    // Check if email is already taken by another user
    if (email !== session.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser && existingUser.id !== params.userId) {
        return Response.json({ error: "Email already in use" }, { status: 400 });
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    return Response.json(updatedUser);
    
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to update user" 
    }, { status: 500 });
  }
}