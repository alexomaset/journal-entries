import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";

// Schema for category update
const categoryUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, "Must be a valid hex color").optional(),
});

// GET - Fetch a specific category
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Extract ID from URL path
    const pathname = request.nextUrl.pathname;
    const id = pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journals: true
          }
        }
      }
    });
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      ...category,
      journalCount: category._count.journals
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PATCH - Update a category
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is an admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Extract ID from URL path
    const pathname = request.nextUrl.pathname;
    const id = pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate input
    const validation = categoryUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    const { name, color } = validation.data;
    
    // If name is being updated, check for uniqueness
    if (name && name !== existingCategory.name) {
      const categoryWithName = await prisma.category.findUnique({
        where: { name },
      });
      
      if (categoryWithName) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }
    }
    
    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        color: color !== undefined ? color : undefined,
      },
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is an admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Extract ID from URL path
    const pathname = request.nextUrl.pathname;
    const id = pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journals: true
          }
        }
      }
    });
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    // Attempt to delete the category
    await prisma.category.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
