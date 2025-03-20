"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiFilter,
  FiCalendar,
  FiTag,
  FiX
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

// Types
type Journal = {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  tags: {
    id: string;
    name: string;
  }[];
};

type Category = {
  id: string;
  name: string;
  color: string;
};

type Tag = {
  id: string;
  name: string;
  count: number;
};

export default function JournalsPage() {
  const router = useRouter();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch journals, categories, and tags
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Build query params for filtering
        const params = new URLSearchParams();
        if (selectedCategory) params.append("categoryId", selectedCategory);
        if (selectedTag) params.append("tag", selectedTag);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        
        // Fetch journals with filters
        const journalsRes = await fetch(`/api/journals?${params.toString()}`);
        if (journalsRes.ok) {
          const journalsData = await journalsRes.json();
          setJournals(journalsData);
        }
        
        // Fetch categories
        const categoriesRes = await fetch("/api/categories");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
        
        // Fetch tags
        const tagsRes = await fetch("/api/tags");
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData);
        }
      } catch (error) {
        console.error("Error fetching journals data:", error);
        toast.error("Failed to load journals");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCategory, selectedTag, startDate, endDate]);
  
  // Delete journal entry
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      setIsDeleting(id);
      try {
        const response = await fetch(`/api/journals/${id}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          setJournals(journals.filter((journal) => journal.id !== id));
          toast.success("Journal entry deleted successfully");
        } else {
          toast.error("Failed to delete journal entry");
        }
      } catch (error) {
        console.error("Error deleting journal entry:", error);
        toast.error("An error occurred while deleting");
      } finally {
        setIsDeleting(null);
      }
    }
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };
  
  // Filter journals by search term
  const filteredJournals = journals.filter((journal) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      journal.title.toLowerCase().includes(term) ||
      journal.content.toLowerCase().includes(term) ||
      journal.category?.name.toLowerCase().includes(term) ||
      journal.tags.some((tag) => tag.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
        <Button 
          onClick={() => router.push("/dashboard/journals/new")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FiPlus className="mr-2" size={16} />
          New Entry
        </Button>
      </div>
      
      {/* Search and filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search journals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <FiFilter className="mr-2" size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700">Category</label>
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tag filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700">Tag</label>
              <select
                value={selectedTag || ""}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.name}>
                    {tag.name} ({tag.count})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date range filters */}
            <div>
              <label className="block text-xs font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="col-span-full flex justify-end">
              <Button 
                variant="ghost" 
                onClick={handleResetFilters}
                className="text-sm"
              >
                <FiX className="mr-2" size={14} />
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Journal entries list */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading journal entries...</div>
        ) : filteredJournals.length > 0 ? (
          <div className="divide-y">
            {filteredJournals.map((journal) => (
              <div key={journal.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/journals/${journal.id}`}
                      className="group"
                    >
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                        {journal.title}
                      </h3>
                    </Link>
                    
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiCalendar size={14} className="mr-1" />
                        <span>{formatDate(journal.date)}</span>
                      </div>
                      
                      {journal.category && (
                        <span 
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ 
                            backgroundColor: `${journal.category.color}20`,
                            color: journal.category.color 
                          }}
                        >
                          {journal.category.name}
                        </span>
                      )}
                      
                      {journal.tags.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1">
                          <FiTag size={14} className="mr-1" />
                          {journal.tags.map((tag) => (
                            <span 
                              key={tag.id}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-xs text-gray-400">
                        {timeAgo(journal.createdAt)}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {journal.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/journals/edit/${journal.id}`)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <FiEdit2 size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(journal.id)}
                      disabled={isDeleting === journal.id}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <FiTrash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {journals.length === 0
                ? "No journal entries found"
                : "No entries match your search criteria"}
            </p>
            
            {journals.length === 0 && (
              <Button
                onClick={() => router.push("/dashboard/journals/new")}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Create your first entry
              </Button>
            )}
            
            {journals.length > 0 && filteredJournals.length === 0 && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
