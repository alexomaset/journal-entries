import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

// Query schema
const summaryQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Helper to count words in a string
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Helper to get hour from ISO date
const getHour = (isoDate: string): number => {
  return new Date(isoDate).getHours();
};

// Helper to extract common words from text
const extractCommonWords = (text: string, limit = 10): { word: string; count: number }[] => {
  // Remove punctuation and convert to lowercase
  const cleanedText = text.toLowerCase().replace(/[^\w\s]|_/g, "");
  const words = cleanedText.split(/\s+/).filter(Boolean);
  
  // Filter out common stop words
  const stopWords = new Set([
    "the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", 
    "this", "with", "i", "you", "it", "not", "or", "be", "are", "from", 
    "at", "as", "your", "have", "more", "an", "was", "were"
  ]);
  
  const filteredWords = words.filter(word => !stopWords.has(word) && word.length > 2);
  
  // Count word frequencies
  const wordCounts: { [key: string]: number } = {};
  
  filteredWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Convert to array and sort by count
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    // Validate query parameters
    const queryValidation = summaryQuerySchema.safeParse({
      startDate: startDateParam,
      endDate: endDateParam,
    });
    
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }
    
    // Build date filters
    const dateFilter: any = {};
    if (startDateParam) {
      dateFilter.gte = new Date(startDateParam);
    }
    if (endDateParam) {
      dateFilter.lte = new Date(endDateParam);
    }
    
    // Fetch journals with their categories within the date range
    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id as string,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      include: {
        category: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    
    if (!journals.length) {
      return NextResponse.json({
        totalCount: 0,
        categoryCounts: [],
        monthlyCountData: [],
        wordCountData: [],
        entryLengthByCategory: [],
        timeOfDayData: [],
        wordFrequencyData: [],
        calendarData: [],
      });
    }
    
    // Calculate word counts for each journal
    const journalsWithWordCounts = journals.map(journal => ({
      ...journal,
      wordCount: countWords(journal.content),
    }));
    
    // Get all categories for proper coloring even when no entries
    const categories = await prisma.category.findMany();
    
    // Calculate category counts
    const categoryMap = new Map();
    journalsWithWordCounts.forEach(journal => {
      const categoryName = journal.category?.name || "Uncategorized";
      const categoryColor = journal.category?.color || "#3b82f6";
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          count: 0,
          totalWordCount: 0,
          color: categoryColor,
        });
      }
      
      const categoryData = categoryMap.get(categoryName);
      categoryData.count += 1;
      categoryData.totalWordCount += journal.wordCount;
    });
    
    // Add any categories with no entries
    categories.forEach(category => {
      if (!categoryMap.has(category.name)) {
        categoryMap.set(category.name, {
          name: category.name,
          count: 0,
          totalWordCount: 0,
          color: category.color,
        });
      }
    });
    
    const categoryCounts = Array.from(categoryMap.values())
      .map(({ name, count, color }) => ({ name, count, color }));
    
    // Calculate entry length by category
    const entryLengthByCategory = Array.from(categoryMap.values())
      .map(({ name, count, totalWordCount, color }) => ({
        category: name,
        avgWordCount: count > 0 ? Math.round(totalWordCount / count) : 0,
        color,
      }));
    
    // Aggregate monthly data
    const monthlyMap = new Map();
    journalsWithWordCounts.forEach(journal => {
      const date = new Date(journal.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleString("default", { month: "short", year: "numeric" });
      
      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, {
          month: monthName,
          count: 0,
        });
      }
      
      const monthData = monthlyMap.get(monthYear);
      monthData.count += 1;
    });
    
    const monthlyCountData = Array.from(monthlyMap.values());
    
    // Word count data for trend
    const wordCountData = journalsWithWordCounts.map(journal => ({
      date: new Date(journal.date).toISOString().split("T")[0],
      wordCount: journal.wordCount,
    }));
    
    // Time of day data
    const timeMap = new Map();
    for (let hour = 0; hour < 24; hour++) {
      timeMap.set(hour, {
        hour: String(hour),
        count: 0,
      });
    }
    
    journalsWithWordCounts.forEach(journal => {
      const hour = getHour(journal.date.toISOString());
      const timeData = timeMap.get(hour);
      timeData.count += 1;
    });
    
    const timeOfDayData = Array.from(timeMap.values());
    
    // Calendar data for heatmap
    const calendarMap = new Map();
    journalsWithWordCounts.forEach(journal => {
      const date = new Date(journal.date).toISOString().split("T")[0];
      
      if (!calendarMap.has(date)) {
        calendarMap.set(date, {
          date,
          count: 0,
        });
      }
      
      const dayData = calendarMap.get(date);
      dayData.count += 1;
    });
    
    const calendarData = Array.from(calendarMap.values());
    
    // Word frequency analysis
    const allText = journalsWithWordCounts
      .map(journal => journal.content)
      .join(" ");
      
    const wordFrequencyData = extractCommonWords(allText, 10);
    
    // Return all summary data
    return NextResponse.json({
      totalCount: journals.length,
      categoryCounts,
      monthlyCountData,
      wordCountData,
      entryLengthByCategory,
      timeOfDayData,
      wordFrequencyData,
      calendarData,
    });
  } catch (error) {
    console.error("Error fetching journal summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal summary" },
      { status: 500 }
    );
  }
}
