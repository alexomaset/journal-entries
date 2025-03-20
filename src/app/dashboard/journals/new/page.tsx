"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { FiSave, FiX, FiActivity, FiBarChart2, FiTag, FiSmile, FiFileText } from "react-icons/fi";

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
  const [isFetching, setIsFetching] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState(true);
  const [analysisDebounceTimer, setAnalysisDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Set up form with validation
  const {
    register,
    control,
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
  
  // Watch the content to trigger auto-analysis
  const contentValue = watch("content");
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetching(true);
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Set up auto-analysis when content changes
  useEffect(() => {
    if (!autoAnalyzeEnabled || !contentValue || contentValue.length < 50) return;
    
    // Clear existing timer
    if (analysisDebounceTimer) {
      clearTimeout(analysisDebounceTimer);
    }
    
    // Set new timer to analyze after user stops typing
    const timer = setTimeout(() => {
      analyzeContent();
    }, 1000); // Wait 1 second after typing stops
    
    setAnalysisDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [contentValue, autoAnalyzeEnabled]);
  
  // Function to analyze content with AI
  const analyzeContent = async () => {
    const content = contentValue;
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
        const analysisResult = await response.json();
        setAiAnalysis(analysisResult);
        
        // Automatically suggest tags from themes if none are selected
        if (selectedTags.length === 0 && analysisResult.themes.length > 0) {
          setSelectedTags(analysisResult.themes.slice(0, 3));
          setValue("tags", analysisResult.themes.slice(0, 3));
        }
        
        // Set mood from sentiment analysis
        setValue("mood", analysisResult.sentiment.mood);
      } else {
        console.error("Analysis failed");
      }
    } catch (error) {
      console.error("Error during content analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
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

  // Get sentiment color based on mood
  const getSentimentColor = (mood: string) => {
    switch (mood) {
      case "Very Positive": return "bg-green-500 text-white";
      case "Positive": return "bg-green-300 text-green-800";
      case "Neutral": return "bg-gray-300 text-gray-800";
      case "Negative": return "bg-orange-300 text-orange-800";
      case "Very Negative": return "bg-red-400 text-white";
      default: return "bg-gray-300 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Journal Entry</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowAiInsights(!showAiInsights)}
            className="text-blue-600 border-blue-600"
            type="button"
          >
            <FiBarChart2 className="mr-2" size={16} />
            {showAiInsights ? "Hide AI Insights" : "Show AI Insights"}
          </Button>
          
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
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm md:col-span-2">
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
                error={errors.title?.message}
                className="mt-1"
                placeholder="Enter journal title..."
              />
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
                error={errors.date?.message}
                className="mt-1"
              />
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  id="categoryId"
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
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>
              
              {/* Category recommendations from AI */}
              {aiAnalysis && aiAnalysis.categoryRecommendations.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Suggested categories:</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {aiAnalysis.categoryRecommendations.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleSelectCategory(rec.id)}
                        className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100"
                      >
                        {rec.name} ({Math.round(rec.relevance * 100)}%)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Mood tracking from sentiment analysis */}
            <div>
              <label htmlFor="mood" className="block text-sm font-medium text-gray-700">
                Mood
              </label>
              <div className="mt-1">
                <input
                  id="mood"
                  type="text"
                  {...register("mood")}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  {["Very Positive", "Positive", "Neutral", "Negative", "Very Negative"].map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setValue("mood", mood)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                        watch("mood") === mood 
                          ? getSentimentColor(mood) + " ring-2 ring-offset-2 ring-blue-500" 
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <FiSmile className="mr-1" size={14} />
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="mt-1">
                <div className="flex">
                  <Input
                    id="tagInput"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="rounded-r-none"
                    placeholder="Add tags..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-l-none"
                  >
                    Add
                  </Button>
                </div>
                
                {/* Display selected tags */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 text-blue-600 hover:text-blue-800"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Theme suggestions from AI */}
                {aiAnalysis && aiAnalysis.themes.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Suggested themes:</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {aiAnalysis.themes.map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => handleAddThemeAsTag(theme)}
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            selectedTags.includes(theme)
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <FiTag className="mr-1" size={12} />
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* AI Analysis toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoAnalyze"
                checked={autoAnalyzeEnabled}
                onChange={() => setAutoAnalyzeEnabled(!autoAnalyzeEnabled)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="autoAnalyze" className="text-sm text-gray-700">
                Auto-analyze content as I write
              </label>
              {!autoAnalyzeEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={analyzeContent}
                  disabled={isAnalyzing || !contentValue || contentValue.length < 10}
                  className="ml-2"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Now"}
                </Button>
              )}
            </div>
            
            {/* Content textarea */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <div className="mt-1">
                <textarea
                  id="content"
                  {...register("content")}
                  rows={12}
                  className={`block w-full rounded-md border ${
                    errors.content ? "border-red-500" : "border-gray-300"
                  } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                  placeholder="Write your journal entry here..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
                {contentValue && (
                  <p className="mt-1 text-right text-xs text-gray-500">
                    {contentValue.trim().split(/\s+/).filter(Boolean).length} words
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
        
        {/* AI Insights panel */}
        {showAiInsights && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FiActivity className="mr-2" />
              AI Insights
            </h2>
            
            {isAnalyzing ? (
              <div className="mt-4 flex items-center justify-center">
                <p className="text-sm text-gray-500">Analyzing your entry...</p>
              </div>
            ) : !aiAnalysis ? (
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  {contentValue && contentValue.length < 50 
                    ? "Write a bit more to get AI-powered insights."
                    : "Analysis will begin once you start writing."}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* Sentiment analysis */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Sentiment Analysis</h3>
                  <div className="mt-2">
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${getSentimentColor(aiAnalysis.sentiment.mood)}`}>
                      <FiSmile className="mr-1" size={14} />
                      {aiAnalysis.sentiment.mood}
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                      <div 
                        className="h-2 rounded-full bg-blue-600" 
                        style={{ 
                          width: `${((aiAnalysis.sentiment.score + 1) / 2) * 100}%`,
                          marginLeft: `${aiAnalysis.sentiment.score < 0 ? 50 - ((Math.abs(aiAnalysis.sentiment.score)) / 2) * 100 : 50}%`
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>Negative</span>
                      <span>Neutral</span>
                      <span>Positive</span>
                    </div>
                  </div>
                </div>
                
                {/* Word count */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Word Count</h3>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{aiAnalysis.wordCount}</p>
                </div>
                
                {/* Insight */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <FiFileText className="mr-1" size={14} />
                    Entry Insight
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{aiAnalysis.insight}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
