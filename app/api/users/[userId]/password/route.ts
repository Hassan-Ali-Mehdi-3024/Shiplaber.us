import { getSession, hashPassword, validatePassword } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

// Change user password (for the user themselves)
export async function POST(
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
    
    // Users can only change their own password
    if (session.id !== params.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const data = await req.json();
    const { currentPassword, newPassword } = data;
    
    // Basic validation
    if (!currentPassword || !newPassword) {
      return Response.json({ 
        error: "Current password and new password are required" 
      }, { status: 400 });
    }
    
    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        passwordHash: true
      }
    });
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    // Verify current password
    const passwordMatch = await validatePassword(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await prisma.user.update({
      where: { id: params.userId },
      data: { passwordHash: hashedPassword }
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error("Error changing password:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to change password" 
    }, { status: 500 });
  }
}

// Reset user password (for admins)
export async function PUT(
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
    
    const userId = params.userId;
    
    // Check permission to update password
    // - Super Admins can update any password
    // - Resellers can update passwords for their created users
    // - Users cannot update any passwords (must go through their creator)
    if (session.role === 'USER') {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    if (session.role === 'RESELLER') {
      // Resellers can only update passwords for their created users
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creatorId: true, role: true }
      });
      
      if (!user || user.creatorId !== session.id) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      
      // Resellers cannot change other reseller passwords
      if (user.role === 'RESELLER') {
        return Response.json({ error: "Cannot change password of another Reseller" }, { status: 403 });
      }
    }
    
    const data = await req.json();
    
    if (!data.password || data.password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    
    // Hash the new password
    const passwordHash = await hashPassword(data.password);
    
    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error("Error updating password:", error);
    return Response.json({ error: "Failed to update password" }, { status: 500 });
  }
}