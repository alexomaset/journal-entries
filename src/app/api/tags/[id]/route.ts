import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { z } from "zod";

// Schema for tag update
const tagUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// GET - Fetch a specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journals: true
          }
        }
      }
    });
    
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      id: tag.id,
      name: tag.name,
      count: tag._count.journals
    });
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag" },
      { status: 500 }
    );
  }
}

// PATCH - Update a tag
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validation = tagUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
    });
    
    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    
    const { name } = validation.data;
    
    // If name is being updated, check for uniqueness
    if (name !== existingTag.name) {
      const tagWithName = await prisma.tag.findUnique({
        where: { name },
      });
      
      if (tagWithName) {
        return NextResponse.json(
          { error: "Tag with this name already exists" },
          { status: 400 }
        );
      }
    }
    
    // Update tag
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
      },
    });
    
    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id },
    });
    
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    
    // Delete tag
    await prisma.tag.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
