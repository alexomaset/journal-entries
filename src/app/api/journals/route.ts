import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";
import { countWords } from "@/lib/utils";
import { Prisma } from '@prisma/client';

// Schema for creating/updating journals
const journalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().optional().nullable(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Define types for better type safety
type JournalTag = {
  tag: {
    id: string;
    name: string;
  };
};

type JournalWithRelations = {
  id: string;
  title: string;
  content: string;
  date: Date;
  categoryId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  tags: JournalTag[];
};

type FormattedJournal = {
  id: string;
  title: string;
  content: string;
  date: Date;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  tags: {
    id: string;
    name: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Format a journal entry for API response
 * @param journal The journal entry from database
 * @param includeTimestamps Whether to include createdAt and updatedAt fields
 * @returns Formatted journal object
 */
const formatJournal = (journal: JournalWithRelations, includeTimestamps = false): FormattedJournal => {
  const formatted: FormattedJournal = {
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
  };
  
  // Add timestamps if requested
  if (includeTimestamps && journal.createdAt && journal.updatedAt) {
    formatted.createdAt = journal.createdAt;
    formatted.updatedAt = journal.updatedAt;
  }
  
  return formatted;
};

// GET - Fetch all journals for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
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
      const whereClause: Prisma.JournalWhereInput = { userId };
      
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }
      
      if (startDate) {
        whereClause.date = {
          ...(whereClause.date as object || {}),
          gte: new Date(startDate),
        };
      }
      
      if (endDate) {
        whereClause.date = {
          ...(whereClause.date as object || {}),
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
    const where: Prisma.JournalWhereInput = { userId };
    
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
      
      // Format the journals for analysis with proper type assertion
      const formattedJournals = allJournals.map(journal => formatJournal(journal as JournalWithRelations));
      
      // Calculate total count
      const totalCount = formattedJournals.length;
      
      // Calculate category distribution
      const categoryMap = new Map<string, { name: string; color: string; count: number }>();
      
      // Type assertion for formattedJournals to match the expected shape
      (formattedJournals as FormattedJournal[]).forEach(journal => {
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
        
        categoryMap.get(categoryId)!.count += 1;
      });
      
      const categoryCounts = Array.from(categoryMap.values());
      
      // Calculate monthly distribution
      const monthlyMap = new Map();
      formattedJournals.forEach((journal: { date: string | number | Date; }) => {
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
      const wordCountData = formattedJournals.map((journal: { date: string | number | Date; content: string; }) => ({
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
    const query: Prisma.JournalFindManyArgs = {
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
    // Use type assertion to ensure TypeScript recognizes that the include options in the query provide the necessary fields
    const formattedJournals = journals.map((journal) => formatJournal(journal as JournalWithRelations, true));
    
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
    
    if (!session || !session.user || !session.user.id) {
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
    let tagData: { tagId: string; }[] = [];
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
        userId: userId as string, // Ensure userId is treated as string since we've already checked session.user exists
        categoryId: categoryId || null,
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
    const formattedJournal = formatJournal(journal, true);
    
    return NextResponse.json(formattedJournal, { status: 201 });
  } catch (error) {
    console.error("Error creating journal:", error);
    return NextResponse.json(
      { error: "Failed to create journal entry" },
      { status: 500 }
    );
  }
}
