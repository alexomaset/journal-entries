import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import bcrypt from "bcryptjs";

// Profile update schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

// Settings update schema
const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifyEmail: z.boolean(),
});

// Request schema
const requestSchema = z.object({
  profile: profileSchema.optional(),
  settings: settingsSchema.optional(),
});

/**
 * GET /api/user/settings
 * Returns the user's settings
 */
export async function GET() {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        settings: {
          select: {
            id: true,
            theme: true,
            notifyEmail: true,
          },
        },
      },
    });

    // If the user is not found
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return the user's profile and settings
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/settings
 * Updates the user's settings
 */
export async function PUT(req: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const parsedBody = requestSchema.safeParse(body);

    // If the body is invalid
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const data = parsedBody.data;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    });

    // If the user is not found
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update the user's profile
    if (data.profile) {
      const { name, email, currentPassword, password } = data.profile;

      // If the user is trying to change their password
      if (currentPassword && password) {
        // Verify the current password
        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          user.password
        );

        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user with the new password
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name,
            email,
            password: hashedPassword,
          },
        });
      } else {
        // Update the user without changing the password
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name,
            email,
          },
        });
      }
    }

    // Update the user's settings
    if (data.settings) {
      const { theme, notifyEmail } = data.settings;

      // If the user has settings
      if (user.settings) {
        await prisma.settings.update({
          where: { id: user.settings.id },
          data: {
            theme,
            notifyEmail,
          },
        });
      } else {
        // Create settings for the user
        await prisma.settings.create({
          data: {
            userId: user.id,
            theme,
            notifyEmail,
          },
        });
      }
    }

    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
