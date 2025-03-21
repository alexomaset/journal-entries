"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { FiSave, FiX, FiActivity, FiBarChart2, FiTag, FiSmile } from "react-icons/fi";

// Journal form schema
const journalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().nullable().optional(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mood: z.string().optional(),
});

type JournalFormValues = z.infer<typeof journalSchema>;

// Category type
type Category = {
  id: string;
  name: string;
  color: string;
};

// AI Analysis types
type CategoryRecommendation = {
  id: string;
  name: string;
  relevance: number;
};

type SentimentAnalysis = {
  score: number;
  mood: string;
};

type AIAnalysisResult = {
  sentiment: SentimentAnalysis;
  categoryRecommendations: CategoryRecommendation[];
  themes: string[];
  wordCount: number;
  insight: string;
};

export default function NewJournalPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState(true);
  
  // Use ref for timer instead of state to avoid re-renders
  const analysisDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set up form with validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: null,
      date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD
      tags: [],
      mood: "",
    },
  });
  
  // Watch content for auto-analysis
  const contentValue = watch("content");
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };
    
    fetchCategories();
  }, []);
  
  // Function to analyze content with AI
  // Remove contentValue and selectedTags from dependencies to prevent loops
  const analyzeContent = useCallback(async () => {
    // Get current content value directly from watch to avoid dependency
    const content = watch("content");
    if (!content || content.length < 10) return;
    
    setIsAnalyzing(true);
    setShowAiInsights(true);
    
    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data);
        
        // Automatically suggest tags from themes if none are selected
        const currentTags = selectedTags;
        if (currentTags.length === 0 && data.themes.length > 0) {
          const newTags = data.themes.slice(0, 3);
          setSelectedTags(newTags);
          setValue("tags", newTags);
        }
        
        // Set mood from sentiment analysis
        setValue("mood", data.sentiment.mood);
      } else {
        console.error("Analysis failed");
      }
    } catch (error) {
      console.error("Error during content analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [watch, setValue, selectedTags]); // Only depend on stable functions, not state that changes

  // Set up auto-analysis when content changes, using a more stable approach
  useEffect(() => {
    // Early return conditions
    if (!autoAnalyzeEnabled || !contentValue || contentValue.length < 50) {
      return;
    }
    
    // Clear existing timer using ref
    if (analysisDebounceTimerRef.current) {
      clearTimeout(analysisDebounceTimerRef.current);
      analysisDebounceTimerRef.current = null;
    }
    
    // Set new timer to analyze after user stops typing
    const timer = setTimeout(() => {
      analyzeContent();
      // Clear ref after execution
      analysisDebounceTimerRef.current = null;
    }, 1000); // Wait 1 second after typing stops
    
    // Store timer in ref, not state
    analysisDebounceTimerRef.current = timer;
    
    // Cleanup function
    return () => {
      if (analysisDebounceTimerRef.current) {
        clearTimeout(analysisDebounceTimerRef.current);
        analysisDebounceTimerRef.current = null;
      }
    };
  }, [contentValue, autoAnalyzeEnabled, analyzeContent]);
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      const newTags = [...selectedTags, tagInput.trim()];
      setSelectedTags(newTags);
      setValue("tags", newTags);
      setTagInput("");
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    const newTags = selectedTags.filter((t) => t !== tag);
    setSelectedTags(newTags);
    setValue("tags", newTags);
  };
  
  // Handle selecting a recommended category
  const handleSelectCategory = (categoryId: string) => {
    setValue("categoryId", categoryId);
  };
  
  // Handle adding a theme as a tag
  const handleAddThemeAsTag = (theme: string) => {
    if (!selectedTags.includes(theme)) {
      const newTags = [...selectedTags, theme];
      setSelectedTags(newTags);
      setValue("tags", newTags);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: JournalFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/journals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tags: selectedTags,
        }),
      });
      
      if (response.ok) {
        toast.success("Journal entry created successfully");
        router.push("/dashboard/journals");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create journal entry");
      }
    } catch (error) {
      console.error("Error creating journal entry:", error);
      toast.error("An error occurred while creating the journal entry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Journal Entry</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <FiX className="mr-2" size={16} />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FiSave className="mr-2" size={16} />
            {isLoading ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main form column */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <Input
                  id="title"
                  type="text"
                  {...register("title")}
                  className="mt-1"
                  placeholder="Enter journal title..."
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                  className="mt-1"
                />
              </div>
              
              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  id="content"
                  {...register("content")}
                  rows={12}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Write your journal entry..."
                ></textarea>
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>
              
              {/* AI Analysis toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="auto-analyze"
                    type="checkbox"
                    checked={autoAnalyzeEnabled}
                    onChange={(e) => setAutoAnalyzeEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="auto-analyze" className="ml-2 block text-sm text-gray-700">
                    Auto-analyze content
                  </label>
                </div>
                <Button
                  type="button"
                  onClick={() => analyzeContent()}
                  disabled={isAnalyzing || !contentValue || contentValue.length < 10}
                  variant="outline"
                  className="text-sm"
                >
                  <FiActivity className="mr-1.5" size={14} />
                  {isAnalyzing ? "Analyzing..." : "Analyze now"}
                </Button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Category select */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center font-medium text-gray-900">
              <FiTag className="mr-2" size={16} />
              Category
            </h3>
            
            <select
              {...register("categoryId")}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            {/* Category recommendations from AI */}
            {showAiInsights && aiAnalysis && aiAnalysis.categoryRecommendations && (
              <div className="mt-4">
                <h4 className="text-xs font-medium uppercase text-gray-500">
                  Suggested Categories
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {aiAnalysis.categoryRecommendations.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => handleSelectCategory(rec.id)}
                      className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      {rec.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Tags section */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center font-medium text-gray-900">
              <FiTag className="mr-2" size={16} />
              Tags
            </h3>
            
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
              >
                Add
              </Button>
            </div>
            
            {selectedTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:bg-blue-500 focus:text-white focus:outline-none"
                    >
                      <span className="sr-only">Remove tag {tag}</span>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Suggested themes from AI analysis */}
            {showAiInsights && aiAnalysis && aiAnalysis.themes && aiAnalysis.themes.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-medium uppercase text-gray-500">
                  Detected Themes
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {aiAnalysis.themes.map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => handleAddThemeAsTag(theme)}
                      disabled={selectedTags.includes(theme)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        selectedTags.includes(theme)
                          ? "bg-gray-100 text-gray-400"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {theme}
                      {selectedTags.includes(theme) && " ✓"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Mood selection */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center font-medium text-gray-900">
              <FiSmile className="mr-2" size={16} />
              Mood
            </h3>
            
            <select
              {...register("mood")}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select mood</option>
              <option value="Happy">Happy</option>
              <option value="Content">Content</option>
              <option value="Neutral">Neutral</option>
              <option value="Anxious">Anxious</option>
              <option value="Sad">Sad</option>
              <option value="Angry">Angry</option>
              <option value="Excited">Excited</option>
              <option value="Reflective">Reflective</option>
            </select>
            
            {/* AI detected mood */}
            {showAiInsights && aiAnalysis && aiAnalysis.sentiment && (
              <div className="mt-4">
                <h4 className="text-xs font-medium uppercase text-gray-500">
                  Detected Mood
                </h4>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {aiAnalysis.sentiment.mood}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* AI Insights */}
          {showAiInsights && aiAnalysis && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center font-medium text-gray-900">
                <FiBarChart2 className="mr-2" size={16} />
                AI Insights
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Word Count
                  </p>
                  <p className="mt-1">{aiAnalysis.wordCount} words</p>
                </div>
                
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Analysis
                  </p>
                  <p className="mt-1 text-gray-700">{aiAnalysis.insight}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
