"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiEdit2, FiTrash2, FiCalendar, FiTag, FiClock } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { formatDate, timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

// Journal entry type
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

export default function JournalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [journal, setJournal] = useState<Journal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch journal entry
  useEffect(() => {
    const fetchJournal = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/journals/${id}`);
        if (response.ok) {
          const data = await response.json();
          setJournal(data);
        } else {
          toast.error("Failed to load journal entry");
          router.push("/dashboard/journals");
        }
      } catch (error) {
        console.error("Error fetching journal:", error);
        toast.error("An error occurred while loading the journal entry");
        router.push("/dashboard/journals");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchJournal();
    }
  }, [id, router]);

  // Handle delete
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/journals/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Journal entry deleted successfully");
          router.push("/dashboard/journals");
        } else {
          toast.error("Failed to delete journal entry");
        }
      } catch (error) {
        console.error("Error deleting journal:", error);
        toast.error("An error occurred while deleting the journal entry");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading journal entry...</p>
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Journal entry not found</p>
          <Button
            onClick={() => router.push("/dashboard/journals")}
            className="mt-4"
          >
            Back to journals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{journal.title}</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/journals/edit/${id}`)}
          >
            <FiEdit2 className="mr-2" size={16} />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <FiTrash2 className="mr-2" size={16} />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {/* Journal metadata */}
        <div className="mb-6 flex flex-wrap items-center gap-4 border-b pb-4 text-sm text-gray-500">
          <div className="flex items-center">
            <FiCalendar size={16} className="mr-1.5" />
            <span>{formatDate(journal.date)}</span>
          </div>

          <div className="flex items-center">
            <FiClock size={16} className="mr-1.5" />
            <span>{timeAgo(journal.createdAt)}</span>
          </div>

          {journal.category && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${journal.category.color}20`,
                color: journal.category.color,
              }}
            >
              {journal.category.name}
            </span>
          )}

          {journal.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
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
        </div>

        {/* Journal content */}
        <div className="prose max-w-none">
          {journal.content.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/journals")}
          className="text-gray-600"
        >
          Back to all journals
        </Button>
      </div>
    </div>
  );
}
