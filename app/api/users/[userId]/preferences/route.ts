import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

// Update user preferences
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
    
    // Users can only update their own preferences
    if (session.id !== params.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const data = await req.json();
    const { emailNotifications, marketingEmails } = data;
    
    // Basic validation
    if (typeof emailNotifications !== 'boolean' || typeof marketingEmails !== 'boolean') {
      return Response.json({ 
        error: "Invalid preferences format" 
      }, { status: 400 });
    }
    
    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        emailNotifications,
        marketingEmails
      },
      select: {
        id: true,
        emailNotifications: true,
        marketingEmails: true
      }
    });
    
    // Return success with the updated preferences
    return Response.json({ 
      success: true,
      preferences: updatedUser
    });
    
  } catch (error) {
    console.error("Error updating preferences:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to update preferences" 
    }, { status: 500 });
  }
}