import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

// Request schema
const analysisRequestSchema = z.object({
  content: z.string().min(1, "Content is required for analysis"),
});

// Function to analyze sentiment
function analyzeSentiment(text: string): { score: number; mood: string } {
  // List of positive and negative words for basic sentiment analysis
  const positiveWords = [
    "happy", "joy", "excited", "great", "wonderful", "amazing", "good", "excellent",
    "fantastic", "love", "loved", "beautiful", "grateful", "thankful", "appreciate",
    "optimistic", "positive", "proud", "accomplished", "success", "peaceful", "relaxed",
    "calm", "hopeful", "inspired", "blessed", "fun", "enjoyed", "smile", "pleased"
  ];

  const negativeWords = [
    "sad", "angry", "upset", "frustrated", "disappointed", "hate", "terrible",
    "horrible", "awful", "bad", "worried", "anxious", "stressed", "depressed",
    "miserable", "unhappy", "annoyed", "fear", "scared", "tired", "exhausted",
    "lonely", "hurt", "pain", "sorry", "regret", "guilty", "ashamed", "lost",
    "confused", "overwhelmed"
  ];

  // Normalize text
  const normalizedText = text.toLowerCase();
  const words = normalizedText.match(/\b\w+\b/g) || [];
  
  // Count matches
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  // Calculate sentiment score between -1 and 1
  const totalWords = words.length;
  const totalSentimentWords = positiveCount + negativeCount;
  
  // If no sentiment words, return neutral
  if (totalSentimentWords === 0) {
    return { score: 0, mood: "Neutral" };
  }
  
  // Calculate weighted score
  const score = ((positiveCount - negativeCount) / totalSentimentWords) * 
               (totalSentimentWords / Math.min(totalWords, 100)); // Normalize based on length
  
  // Determine mood category
  let mood;
  if (score >= 0.5) mood = "Very Positive";
  else if (score >= 0.1) mood = "Positive";
  else if (score > -0.1) mood = "Neutral";
  else if (score > -0.5) mood = "Negative";
  else mood = "Very Negative";
  
  return { score: parseFloat(score.toFixed(2)), mood };
}

// Function to suggest categories based on content
async function suggestCategories(text: string): Promise<{ id: string; name: string; relevance: number }[]> {
  // Get all available categories
  const allCategories = await prisma.category.findMany();
  
  // Define keyword mappings for categories
  // This could be enhanced with more sophisticated ML/NLP in a production app
  const categoryKeywords: Record<string, string[]> = {
    "Work": ["work", "job", "career", "office", "project", "meeting", "deadline", "colleague", "boss", "professional"],
    "Personal": ["personal", "self", "reflection", "growth", "identity", "goal", "dream", "plan", "future"],
    "Family": ["family", "parent", "child", "kid", "mom", "dad", "brother", "sister", "spouse", "relative", "home"],
    "Health": ["health", "fitness", "exercise", "diet", "workout", "run", "gym", "doctor", "medicine", "symptom", "illness"],
    "Travel": ["travel", "trip", "vacation", "journey", "adventure", "explore", "destination", "flight", "hotel", "tourist"],
    "Finance": ["money", "finance", "budget", "expense", "income", "saving", "investment", "debt", "purchase", "cost"],
    "Education": ["study", "learn", "school", "college", "university", "class", "course", "exam", "teacher", "student", "book"],
    "Creative": ["creative", "art", "music", "write", "paint", "draw", "design", "craft", "project", "create", "imagination"],
    "Spiritual": ["spiritual", "meditation", "prayer", "faith", "belief", "religion", "soul", "meaning", "purpose", "mindful"],
    "Social": ["friend", "social", "party", "gathering", "conversation", "meetup", "relationship", "community", "network", "connection"]
  };
  
  // Normalize text
  const normalizedText = text.toLowerCase();
  
  // Calculate relevance scores
  const relevanceScores: Record<string, number> = {};
  
  // For each category, check for keyword matches
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    let matches = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches_count = (normalizedText.match(regex) || []).length;
      matches += matches_count;
    });
    
    // Calculate relevance score
    if (matches > 0) {
      relevanceScores[category] = matches / Math.sqrt(text.length / 100); // Normalize based on text length
    }
  });
  
  // Map to existing categories and sort by relevance
  const suggestions = allCategories
    .map(category => {
      // Try to match with our predefined categories or use exact name match
      const relevance = relevanceScores[category.name] || 
                        (normalizedText.includes(category.name.toLowerCase()) ? 0.5 : 0);
      
      return {
        id: category.id,
        name: category.name,
        relevance: parseFloat(relevance.toFixed(2))
      };
    })
    .filter(cat => cat.relevance > 0) // Only include relevant categories
    .sort((a, b) => b.relevance - a.relevance) // Sort by relevance
    .slice(0, 3); // Take top 3
  
  return suggestions;
}

// Function to extract key themes/topics from the content
function extractThemes(text: string): string[] {
  // This is a simplified version. In a production app, you'd use NLP/ML for better results
  // Common stop words to filter out
  const stopWords = new Set([
    "the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", 
    "this", "with", "i", "you", "it", "not", "or", "be", "are", "from", 
    "at", "as", "your", "have", "more", "an", "was", "were", "they", "will",
    "there", "their", "what", "all", "when", "up", "out", "about", "who",
    "get", "which", "go", "me", "one", "my", "would", "very", "just", "can"
  ]);
  
  // Normalize text
  const normalizedText = text.toLowerCase();
  
  // Extract words, removing punctuation
  const words = normalizedText.match(/\b\w+\b/g) || [];
  
  // Count word frequencies, excluding stop words and short words
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    if (!stopWords.has(word) && word.length > 3) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // Convert to array and sort by frequency
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Take top 5 words
    .map(([word]) => word);
  
  return sortedWords;
}

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = analysisRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { content } = validation.data;
    
    // Perform AI analysis
    const sentiment = analyzeSentiment(content);
    const categoryRecommendations = await suggestCategories(content);
    const themes = extractThemes(content);
    
    // Calculate word count
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    
    // Generate a summary/insight
    let insight = "Based on your entry, ";
    if (sentiment.mood !== "Neutral") {
      insight += `your mood appears to be ${sentiment.mood.toLowerCase()}. `;
    }
    
    if (categoryRecommendations.length > 0) {
      insight += `This entry seems to focus on themes related to ${categoryRecommendations.map(c => c.name.toLowerCase()).join(", ")}. `;
    }
    
    if (themes.length > 0) {
      insight += `Key topics include: ${themes.join(", ")}.`;
    }
    
    // Return analysis results
    return NextResponse.json({
      sentiment,
      categoryRecommendations,
      themes,
      wordCount,
      insight
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "Failed to perform AI analysis" },
      { status: 500 }
    );
  }
}
