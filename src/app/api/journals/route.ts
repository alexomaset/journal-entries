import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from "zod";
import { countWords } from "@/lib/utils";

// Schema for creating/updating journals
const journalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().optional().nullable(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// GET - Fetch all journals for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const categoryId = searchParams.get("categoryId");
    const tag = searchParams.get("tag");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const statsRequested = searchParams.get("stats") === "true";
    const countRequested = searchParams.get("count") === "true";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    
    // If only count is requested
    if (countRequested) {
      const whereClause: any = { userId };
      
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }
      
      if (startDate) {
        whereClause.date = {
          ...(whereClause.date || {}),
          gte: new Date(startDate),
        };
      }
      
      if (endDate) {
        whereClause.date = {
          ...(whereClause.date || {}),
          lte: new Date(endDate),
        };
      }
      
      // Handle tag filtering for count
      if (tag) {
        const count = await prisma.journal.count({
          where: {
            ...whereClause,
            tags: {
              some: {
                tag: {
                  name: tag
                }
              }
            },
          },
        });
        return NextResponse.json({ count });
      }
      
      // Get count of journals matching criteria
      const count = await prisma.journal.count({
        where: whereClause,
      });
      
      return NextResponse.json({ count });
    }
    
    // Build filter conditions
    const where: any = { userId };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate) };
    } else if (endDate) {
      where.date = { lte: new Date(endDate) };
    }
    
    // Create tag filter if provided
    const tagFilter = tag ? {
      tags: {
        some: {
          tag: {
            name: tag
          }
        }
      }
    } : {};
    
    // If statistics are requested
    if (statsRequested) {
      // Fetch all journals within date range with necessary relations
      const allJournals = await prisma.journal.findMany({
        where: {
          ...where,
          ...tagFilter
        },
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: {
          date: 'asc' // Order by date ascending for chronological analysis
        }
      });
      
      // Format the journals for analysis
      const formattedJournals = allJournals.map(journal => ({
        id: journal.id,
        title: journal.title,
        content: journal.content,
        date: journal.date,
        categoryId: journal.categoryId,
        category: journal.category ? {
          id: journal.category.id,
          name: journal.category.name,
          color: journal.category.color
        } : null,
        tags: journal.tags.map(tag => ({
          id: tag.tag.id,
          name: tag.tag.name
        }))
      }));
      
      // Calculate total count
      const totalCount = formattedJournals.length;
      
      // Calculate category distribution
      const categoryMap = new Map();
      formattedJournals.forEach(journal => {
        const categoryName = journal.category?.name || "Uncategorized";
        const categoryColor = journal.category?.color || "#6b7280";
        const categoryId = journal.category?.id || "none";
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            name: categoryName,
            color: categoryColor,
            count: 0,
          });
        }
        
        categoryMap.get(categoryId).count += 1;
      });
      
      const categoryCounts = Array.from(categoryMap.values());
      
      // Calculate monthly distribution
      const monthlyMap = new Map();
      formattedJournals.forEach(journal => {
        const date = new Date(journal.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyMap.has(monthYear)) {
          monthlyMap.set(monthYear, {
            month: monthYear,
            count: 0,
          });
        }
        
        monthlyMap.get(monthYear).count += 1;
      });
      
      const monthlyCountData = Array.from(monthlyMap.values())
        .sort((a, b) => {
          const [aMonth, aYear] = a.month.split(' ');
          const [bMonth, bYear] = b.month.split(' ');
          
          if (aYear !== bYear) {
            return parseInt(aYear) - parseInt(bYear);
          }
          
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(aMonth) - months.indexOf(bMonth);
        });
      
      // Calculate word count data
      const wordCountData = formattedJournals.map(journal => ({
        date: new Date(journal.date).toLocaleDateString(),
        wordCount: countWords(journal.content),
      }));
      
      // Return statistics
      return NextResponse.json({
        stats: {
          totalCount,
          categoryCounts,
          monthlyCountData,
          wordCountData,
        }
      });
    }
    
    // Regular journal fetching with filters
    const query: any = {
      where: {
        ...where,
        ...tagFilter
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    };
    
    // Apply limit if specified
    if (limit) {
      query.take = limit;
    }
    
    const journals = await prisma.journal.findMany(query);
    
    // Format the journals for the response
    const formattedJournals = journals.map(journal => ({
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
    }));
    
    return NextResponse.json(formattedJournals);
  } catch (error) {
    console.error("Error fetching journals:", error);
    return NextResponse.json(
      { error: "Failed to fetch journals" },
      { status: 500 }
    );
  }
}

// POST - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    
    // Validate input
    const validation = journalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { title, content, categoryId, date, tags } = validation.data;
    
    // Process tags if provided
    let tagData = [];
    if (tags && tags.length > 0) {
      // For each tag name, either find existing or create new
      tagData = await Promise.all(
        tags.map(async (tagName) => {
          const existingTag = await prisma.tag.findUnique({
            where: { name: tagName },
          });
          
          if (existingTag) {
            return { tagId: existingTag.id };
          } else {
            const newTag = await prisma.tag.create({
              data: { name: tagName },
            });
            return { tagId: newTag.id };
          }
        })
      );
    }
    
    // Create journal with tags
    const journal = await prisma.journal.create({
      data: {
        title,
        content,
        date: date ? new Date(date) : new Date(),
        userId,
        categoryId: categoryId || undefined,
        tags: {
          create: tagData
        }
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
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
    
    return NextResponse.json(formattedJournal, { status: 201 });
  } catch (error) {
    console.error("Error creating journal:", error);
    return NextResponse.json(
      { error: "Failed to create journal entry" },
      { status: 500 }
    );
  }
}
