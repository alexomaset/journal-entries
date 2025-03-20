"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiPlus, FiClock, FiCalendar, FiBookOpen, FiTag } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { formatDate, timeAgo, truncateText } from "@/lib/utils";
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

export default function DashboardPage() {
  const router = useRouter();
  const [recentJournals, setRecentJournals] = useState<Journal[]>([]);
  const [stats, setStats] = useState({
    totalEntries: 0,
    categories: 0,
    tags: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recent journals and stats
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch recent journals
        const journalsRes = await fetch("/api/journals?limit=5");
        
        if (journalsRes.ok) {
          const journalsData = await journalsRes.json();
          setRecentJournals(journalsData);
        }
        
        // Fetch categories count
        const categoriesRes = await fetch("/api/categories");
        const tagsRes = await fetch("/api/tags");
        
        if (categoriesRes.ok && tagsRes.ok) {
          const categoriesData = await categoriesRes.json();
          const tagsData = await tagsRes.json();
          
          setStats({
            totalEntries: recentJournals.length,
            categories: categoriesData.length,
            tags: tagsData.length,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Quick stats cards
  const statsCards = [
    {
      title: "Journal Entries",
      value: stats.totalEntries,
      icon: <FiBookOpen size={24} className="text-blue-500" />,
    },
    {
      title: "Categories",
      value: stats.categories,
      icon: <FiTag size={24} className="text-green-500" />,
    },
    {
      title: "Most Recent",
      value: recentJournals.length > 0 ? timeAgo(recentJournals[0]?.createdAt) : "No entries",
      icon: <FiClock size={24} className="text-purple-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Journal</h1>
        <Button 
          onClick={() => router.push("/dashboard/journals/new")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FiPlus className="mr-2" size={16} />
          New Entry
        </Button>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((card, index) => (
          <div 
            key={index}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className="rounded-full bg-gray-50 p-3">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent entries */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
          <Link 
            href="/dashboard/journals"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
        
        {isLoading ? (
          <div className="py-6 text-center text-gray-500">Loading recent entries...</div>
        ) : recentJournals.length > 0 ? (
          <div className="divide-y">
            {recentJournals.map((journal) => (
              <div key={journal.id} className="py-4">
                <Link 
                  href={`/dashboard/journals/${journal.id}`}
                  className="group block"
                >
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {journal.title}
                  </h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <FiCalendar size={14} className="mr-1" />
                    <span>{formatDate(journal.date)}</span>
                    {journal.category && (
                      <>
                        <span className="mx-2">•</span>
                        <span 
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ 
                            backgroundColor: `${journal.category.color}20`,
                            color: journal.category.color 
                          }}
                        >
                          {journal.category.name}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {truncateText(journal.content, 150)}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-gray-500">No journal entries yet</p>
            <Button
              onClick={() => router.push("/dashboard/journals/new")}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Create your first entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
