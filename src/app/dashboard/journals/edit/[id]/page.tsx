"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { FiSave, FiX } from "react-icons/fi";

// Journal form schema
const journalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().nullable().optional(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type JournalFormValues = z.infer<typeof journalSchema>;

// Types
type Category = {
  id: string;
  name: string;
  color: string;
};

export default function EditJournalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Set up form with validation
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: null,
      date: new Date().toISOString().split("T")[0],
      tags: [],
    },
  });
  
  // Fetch journal entry and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      try {
        // Fetch the journal entry
        const journalRes = await fetch(`/api/journals/${id}`);
        if (!journalRes.ok) {
          toast.error("Failed to load journal entry");
          router.push("/dashboard/journals");
          return;
        }
        
        const journalData = await journalRes.json();
        
        // Extract tag names
        const tagNames = journalData.tags.map((tag: { name: string }) => tag.name);
        setSelectedTags(tagNames);
        
        // Set form values
        reset({
          title: journalData.title,
          content: journalData.content,
          categoryId: journalData.categoryId,
          date: journalData.date.split("T")[0], // Format date as YYYY-MM-DD
          tags: tagNames,
        });
        
        // Fetch categories
        const categoriesRes = await fetch("/api/categories");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while loading data");
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchData();
  }, [id, router, reset]);
  
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
  
  // Handle form submission
  const onSubmit = async (data: JournalFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/journals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tags: selectedTags,
        }),
      });
      
      if (response.ok) {
        toast.success("Journal entry updated successfully");
        router.push(`/dashboard/journals/${id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update journal entry");
      }
    } catch (error) {
      console.error("Error updating journal entry:", error);
      toast.error("An error occurred while updating the journal entry");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading journal entry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Journal Entry</h1>
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
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
      
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
              error={errors.title?.message}
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
          
          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="categoryId"
              {...register("categoryId")}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
            </div>
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
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
