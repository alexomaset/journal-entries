"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi";

// Category type
type Category = {
  id: string;
  name: string;
  color: string;
  journalCount?: number;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3b82f6"); // Default blue

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        
        // Get journal counts for each category
        const categoriesWithCounts = await Promise.all(
          data.map(async (category: Category) => {
            const countRes = await fetch(`/api/journals?categoryId=${category.id}&count=true`);
            if (countRes.ok) {
              const { count } = await countRes.json();
              return { ...category, journalCount: count };
            }
            return { ...category, journalCount: 0 };
          })
        );
        
        setCategories(categoriesWithCounts);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add new category
  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          color: categoryColor,
        }),
      });

      if (response.ok) {
        toast.success("Category added successfully");
        setCategoryName("");
        setCategoryColor("#3b82f6");
        setIsAdding(false);
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("An error occurred while adding the category");
    }
  };

  // Update category
  const handleUpdateCategory = async (id: string) => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          color: categoryColor,
        }),
      });

      if (response.ok) {
        toast.success("Category updated successfully");
        setCategoryName("");
        setCategoryColor("#3b82f6");
        setEditingId(null);
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("An error occurred while updating the category");
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: string) => {
    // Find the category to check its journal count
    const category = categories.find((c) => c.id === id);
    
    // If category has journals, confirm before deletion
    if (category && category.journalCount && category.journalCount > 0) {
      if (!confirm(`This category has ${category.journalCount} journal entries. Deleting it will remove the category from these entries. Continue?`)) {
        return;
      }
    } else if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Category deleted successfully");
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("An error occurred while deleting the category");
    }
  };

  // Set up edit mode
  const handleEditClick = (category: Category) => {
    setCategoryName(category.name);
    setCategoryColor(category.color);
    setEditingId(category.id);
    setIsAdding(false);
  };

  // Cancel editing or adding
  const handleCancel = () => {
    setCategoryName("");
    setCategoryColor("#3b82f6");
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        {!isAdding && !editingId && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FiPlus className="mr-2" size={16} />
            New Category
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-900">
            {isAdding ? "Add New Category" : "Edit Category"}
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                Category Name
              </label>
              <Input
                id="categoryName"
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="mt-1"
                placeholder="Enter category name..."
              />
            </div>
            <div>
              <label htmlFor="categoryColor" className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <div className="flex mt-1 items-center space-x-2">
                <Input
                  id="categoryColor"
                  type="color"
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)}
                  className="w-12 h-10 p-0.5"
                />
                <div className="w-full">
                  <Input
                    type="text"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                <FiX className="mr-2" size={16} />
                Cancel
              </Button>
              <Button
                onClick={isAdding ? handleAddCategory : () => handleUpdateCategory(editingId!)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FiSave className="mr-2" size={16} />
                {isAdding ? "Add Category" : "Update Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading categories...</div>
        ) : categories.length > 0 ? (
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {category.journalCount} {category.journalCount === 1 ? "entry" : "entries"}
                    </p>
                  </div>
                </div>
                {!isAdding && !editingId && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(category)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <FiEdit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <FiTrash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No categories found</p>
            {!isAdding && !editingId && (
              <Button
                onClick={() => setIsAdding(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Create your first category
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
