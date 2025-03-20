import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Schema for profile updates
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  currentPassword: z.string().optional(),
});

// Schema for settings updates
const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifyEmail: z.boolean(),
});

// GET handler to fetch user settings
export async function GET(req: NextRequest) {
  try {
    // Get current session and user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user with settings
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Return sanitized user data (remove password)
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

// PUT handler to update user profile and settings
export async function PUT(req: NextRequest) {
  try {
    // Get current session and user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    
    // Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Handle profile updates
    if (body.profile) {
      const profileResult = profileSchema.safeParse(body.profile);
      
      if (!profileResult.success) {
        return NextResponse.json(
          { error: "Invalid profile data", details: profileResult.error },
          { status: 400 }
        );
      }
      
      const { name, email, password, currentPassword } = profileResult.data;
      
      // If password update is requested, verify current password
      if (password && currentPassword) {
        const passwordMatch = await bcrypt.compare(
          currentPassword,
          currentUser.password
        );
        
        if (!passwordMatch) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update user with new password
        await prisma.user.update({
          where: { id: currentUser.id },
          data: {
            name,
            email,
            password: hashedPassword,
          },
        });
      } else {
        // Update user without changing password
        await prisma.user.update({
          where: { id: currentUser.id },
          data: {
            name,
            email,
          },
        });
      }
    }
    
    // Handle settings updates
    if (body.settings) {
      const settingsResult = settingsSchema.safeParse(body.settings);
      
      if (!settingsResult.success) {
        return NextResponse.json(
          { error: "Invalid settings data", details: settingsResult.error },
          { status: 400 }
        );
      }
      
      // Update or create settings
      await prisma.settings.upsert({
        where: { userId: currentUser.id },
        update: settingsResult.data,
        create: {
          ...settingsResult.data,
          userId: currentUser.id,
        },
      });
    }
    
    // Return updated user with settings
    const updatedUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { settings: true },
    });
    
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Return sanitized user data (remove password)
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json({
      message: "Settings updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
