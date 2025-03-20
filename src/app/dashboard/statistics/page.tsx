"use client";

import React, { useState, useEffect } from "react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { FiCalendar } from "react-icons/fi";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Types
type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
};

type JournalStats = {
  totalCount: number;
  categoryCounts: {
    name: string;
    count: number;
    color: string;
  }[];
  monthlyCountData: {
    month: string;
    count: number;
  }[];
  wordCountData: {
    date: string;
    wordCount: number;
  }[];
};

export default function StatisticsPage() {
  const [stats, setStats] = useState<JournalStats>({
    totalCount: 0,
    categoryCounts: [],
    monthlyCountData: [],
    wordCountData: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("startDate", dateRange.startDate);
        params.append("endDate", dateRange.endDate);
        params.append("stats", "true");
        
        const response = await fetch(`/api/journals?${params.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        } else {
          toast.error("Failed to load statistics");
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
        toast.error("An error occurred while loading statistics");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [dateRange]);

  // Prepare chart data for category distribution
  const categoryChartData: ChartData = {
    labels: stats.categoryCounts.map(cat => cat.name || "Uncategorized"),
    datasets: [
      {
        label: "Journal Entries by Category",
        data: stats.categoryCounts.map(cat => cat.count),
        backgroundColor: stats.categoryCounts.map(cat => cat.color || "#3b82f6"),
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for monthly distribution
  const monthlyChartData: ChartData = {
    labels: stats.monthlyCountData.map(item => item.month),
    datasets: [
      {
        label: "Journal Entries by Month",
        data: stats.monthlyCountData.map(item => item.count),
        backgroundColor: ["rgba(59, 130, 246, 0.6)"],
        borderColor: ["rgba(59, 130, 246, 1)"],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for word count trends
  const wordCountChartData: ChartData = {
    labels: stats.wordCountData.map(item => item.date),
    datasets: [
      {
        label: "Word Count per Entry",
        data: stats.wordCountData.map(item => item.wordCount),
        backgroundColor: ["rgba(16, 185, 129, 0.2)"],
        borderColor: ["rgba(16, 185, 129, 1)"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Journal Statistics</h1>
      
      {/* Date range selector */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Date Range</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <div className="mt-1 flex items-center">
              <FiCalendar size={16} className="mr-2 text-gray-400" />
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <div className="mt-1 flex items-center">
              <FiCalendar size={16} className="mr-2 text-gray-400" />
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      ) : stats.totalCount === 0 ? (
        <div className="rounded-lg border bg-white p-6 shadow-sm text-center">
          <p className="text-gray-500">No journal entries found in the selected date range.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500">Total Entries</h2>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalCount}</p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500">Categories Used</h2>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.categoryCounts.length}</p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500">Avg. Words Per Entry</h2>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {stats.wordCountData.length > 0
                  ? Math.round(
                      stats.wordCountData.reduce((sum, item) => sum + item.wordCount, 0) /
                        stats.wordCountData.length
                    )
                  : 0}
              </p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Category Distribution */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Entry Distribution by Category</h2>
              <div className="h-64">
                <Pie 
                  data={categoryChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            {/* Monthly Distribution */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Monthly Journal Activity</h2>
              <div className="h-64">
                <Bar 
                  data={monthlyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            {/* Word Count Trend */}
            <div className="col-span-1 rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Word Count Trend</h2>
              <div className="h-64">
                <Line 
                  data={wordCountChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
