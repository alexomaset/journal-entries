"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { FiPlus, FiX, FiSave, FiTrash2 } from "react-icons/fi";

// Tag type
type Tag = {
  id: string;
  name: string;
  count?: number;
};

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [tagName, setTagName] = useState("");

  // Fetch tags
  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        
        // Get journal counts for each tag
        const tagsWithCounts = await Promise.all(
          data.map(async (tag: Tag) => {
            const countRes = await fetch(`/api/journals?tag=${tag.name}&count=true`);
            if (countRes.ok) {
              const { count } = await countRes.json();
              return { ...tag, count };
            }
            return { ...tag, count: 0 };
          })
        );
        
        setTags(tagsWithCounts);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Add new tag
  const handleAddTag = async () => {
    if (!tagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tagName.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Tag added successfully");
        setTagName("");
        setIsAdding(false);
        fetchTags();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add tag");
      }
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("An error occurred while adding the tag");
    }
  };

  // Delete tag
  const handleDeleteTag = async (id: string) => {
    // Find the tag to check its count
    const tag = tags.find((t) => t.id === id);
    
    // If tag has journals, confirm before deletion
    if (tag && tag.count && tag.count > 0) {
      if (!confirm(`This tag is used in ${tag.count} journal entries. Deleting it will remove the tag from these entries. Continue?`)) {
        return;
      }
    } else if (!confirm("Are you sure you want to delete this tag?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tag deleted successfully");
        fetchTags();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete tag");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("An error occurred while deleting the tag");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
        {!isAdding && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FiPlus className="mr-2" size={16} />
            New Tag
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Add New Tag</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="tagName" className="block text-sm font-medium text-gray-700">
                Tag Name
              </label>
              <Input
                id="tagName"
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                className="mt-1"
                placeholder="Enter tag name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
            </div>
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setTagName("");
                  setIsAdding(false);
                }}
              >
                <FiX className="mr-2" size={16} />
                Cancel
              </Button>
              <Button
                onClick={handleAddTag}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FiSave className="mr-2" size={16} />
                Add Tag
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tags List */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading tags...</div>
        ) : tags.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <h3 className="font-medium text-gray-900">{tag.name}</h3>
                  <p className="text-sm text-gray-500">
                    {tag.count} {tag.count === 1 ? "entry" : "entries"}
                  </p>
                </div>
                {!isAdding && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <FiTrash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No tags found</p>
            {!isAdding && (
              <Button
                onClick={() => setIsAdding(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Create your first tag
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
