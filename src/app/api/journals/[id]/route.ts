import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { z } from "zod";

// Schema for updating journals
const journalUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  categoryId: z.string().optional().nullable(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// GET - Fetch a specific journal entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id } = params;
    
    const journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    if (!journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }
    
    // Check if the journal belongs to the authenticated user
    if (journal.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Format the response
    const formattedJournal = {
      id: journal.id,
      title: journal.title,
      content: journal.content,
      date: journal.date,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
      category: journal.category ? {
        id: journal.category.id,
        name: journal.category.name,
        color: journal.category.color
      } : null,
      tags: journal.tags.map(tag => ({
        id: tag.tag.id,
        name: tag.tag.name
      }))
    };
    
    return NextResponse.json(formattedJournal);
  } catch (error) {
    console.error("Error fetching journal:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entry" },
      { status: 500 }
    );
  }
}

// PATCH - Update a journal entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validation = journalUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    // Check if journal exists and belongs to the user
    const existingJournal = await prisma.journal.findUnique({
      where: { id },
    });
    
    if (!existingJournal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }
    
    if (existingJournal.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const { title, content, categoryId, date, tags } = validation.data;
    
    // Begin transaction to handle both journal update and tag updates
    const updatedJournal = await prisma.$transaction(async (prisma) => {
      // Update the journal
      const journal = await prisma.journal.update({
        where: { id },
        data: {
          title: title !== undefined ? title : undefined,
          content: content !== undefined ? content : undefined,
          date: date ? new Date(date) : undefined,
          categoryId: categoryId !== undefined ? categoryId : undefined,
        },
        include: {
          category: true,
        }
      });
      
      // Update tags if provided
      if (tags !== undefined) {
        // First, remove all existing tag relationships
        await prisma.tagsOnJournals.deleteMany({
          where: { journalId: id }
        });
        
        // Then add the new tags
        for (const tagName of tags) {
          // Find or create tag
          let tag = await prisma.tag.findUnique({
            where: { name: tagName }
          });
          
          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: tagName }
            });
          }
          
          // Create the relationship
          await prisma.tagsOnJournals.create({
            data: {
              journalId: id,
              tagId: tag.id
            }
          });
        }
      }
      
      // Fetch the updated journal with all relationships
      return prisma.journal.findUnique({
        where: { id },
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
    });
    
    if (!updatedJournal) {
      return NextResponse.json({ error: "Failed to update journal" }, { status: 500 });
    }
    
    // Format the response
    const formattedJournal = {
      id: updatedJournal.id,
      title: updatedJournal.title,
      content: updatedJournal.content,
      date: updatedJournal.date,
      createdAt: updatedJournal.createdAt,
      updatedAt: updatedJournal.updatedAt,
      category: updatedJournal.category ? {
        id: updatedJournal.category.id,
        name: updatedJournal.category.name,
        color: updatedJournal.category.color
      } : null,
      tags: updatedJournal.tags.map(tag => ({
        id: tag.tag.id,
        name: tag.tag.name
      }))
    };
    
    return NextResponse.json(formattedJournal);
  } catch (error) {
    console.error("Error updating journal:", error);
    return NextResponse.json(
      { error: "Failed to update journal entry" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id } = params;
    
    // Check if journal exists and belongs to the user
    const journal = await prisma.journal.findUnique({
      where: { id },
    });
    
    if (!journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }
    
    if (journal.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Delete the journal (cascading will handle related tag relationships)
    await prisma.journal.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: "Journal deleted successfully" });
  } catch (error) {
    console.error("Error deleting journal:", error);
    return NextResponse.json(
      { error: "Failed to delete journal entry" },
      { status: 500 }
    );
  }
}
