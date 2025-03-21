import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";

// Schema for tag creation
const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// GET - Fetch all tags
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            journals: true
          }
        }
      }
    });
    
    // Format tags with count
    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.journals
    }));
    
    return NextResponse.json(formattedTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate input
    const validation = tagSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { name } = validation.data;
    
    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name },
    });
    
    if (existingTag) {
      return NextResponse.json(existingTag);
    }
    
    // Create tag
    const tag = await prisma.tag.create({
      data: {
        name,
      },
    });
    
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
