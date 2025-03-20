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
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { FiCalendar, FiClock } from "react-icons/fi";
import ScrollableContainer from "../layout-components/ScrollableContainer";

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

type SummaryData = {
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
  entryLengthByCategory: {
    category: string;
    avgWordCount: number;
    color: string;
  }[];
  timeOfDayData: {
    hour: string;
    count: number;
  }[];
  wordFrequencyData: {
    word: string;
    count: number;
  }[];
  calendarData: {
    date: string;
    count: number;
  }[];
};

// Generate calendar dates for the heatmap
const generateCalendarDates = (startDate: string, endDate: string) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date).toISOString().split('T')[0]);
  }
  
  return dates;
};

export default function SummaryPage() {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalCount: 0,
    categoryCounts: [],
    monthlyCountData: [],
    wordCountData: [],
    entryLengthByCategory: [],
    timeOfDayData: [],
    wordFrequencyData: [],
    calendarData: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Fetch summary data
  useEffect(() => {
    const fetchSummaryData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("startDate", dateRange.startDate);
        params.append("endDate", dateRange.endDate);
        params.append("summary", "true");
        
        const response = await fetch(`/api/journals/summary?${params.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          setSummaryData(data);
        } else {
          toast.error("Failed to load summary data");
        }
      } catch (error) {
        console.error("Error fetching summary data:", error);
        toast.error("An error occurred while loading summary data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSummaryData();
  }, [dateRange]);

  // Prepare chart data for category distribution
  const categoryChartData: ChartData = {
    labels: summaryData.categoryCounts.map(cat => cat.name || "Uncategorized"),
    datasets: [
      {
        label: "Journal Entries by Category",
        data: summaryData.categoryCounts.map(cat => cat.count),
        backgroundColor: summaryData.categoryCounts.map(cat => cat.color || "#3b82f6"),
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for entry length by category
  const entryLengthChartData: ChartData = {
    labels: summaryData.entryLengthByCategory.map(cat => cat.category || "Uncategorized"),
    datasets: [
      {
        label: "Average Word Count by Category",
        data: summaryData.entryLengthByCategory.map(cat => cat.avgWordCount),
        backgroundColor: summaryData.entryLengthByCategory.map(cat => cat.color || "#3b82f6"),
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for time of day
  const timeOfDayChartData: ChartData = {
    labels: summaryData.timeOfDayData.map(item => `${item.hour}:00`),
    datasets: [
      {
        label: "Entries by Time of Day",
        data: summaryData.timeOfDayData.map(item => item.count),
        backgroundColor: ["rgba(16, 185, 129, 0.6)"],
        borderColor: ["rgba(16, 185, 129, 1)"],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for word frequency
  const wordFrequencyChartData: ChartData = {
    labels: summaryData.wordFrequencyData.map(item => item.word),
    datasets: [
      {
        label: "Word Frequency",
        data: summaryData.wordFrequencyData.map(item => item.count),
        backgroundColor: ["rgba(245, 158, 11, 0.6)"],
        borderColor: ["rgba(245, 158, 11, 1)"],
        borderWidth: 1,
      },
    ],
  };

  // Generate calendar data for heat map visualization
  const calendarDates = generateCalendarDates(dateRange.startDate, dateRange.endDate);
  const calendarHeatMap = calendarDates.map(date => {
    const entryForDate = summaryData.calendarData.find(entry => entry.date === date);
    return {
      date,
      count: entryForDate ? entryForDate.count : 0,
    };
  });

  // Calculate month columns for calendar view
  const months = Array.from(
    new Set(
      calendarDates.map(date => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  );

  return (
    <ScrollableContainer>
      <h1 className="text-2xl font-bold text-gray-900">Journal Summary</h1>
      
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
          <p className="text-gray-500">Loading summary data...</p>
        </div>
      ) : summaryData.totalCount === 0 ? (
        <div className="rounded-lg border bg-white p-6 shadow-sm text-center">
          <p className="text-gray-500">No journal entries found in the selected date range.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500">Total Entries</h2>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{summaryData.totalCount}</p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500">Categories Used</h2>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{summaryData.categoryCounts.length}</p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500">Avg. Words Per Entry</h2>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {summaryData.wordCountData.length > 0
                  ? Math.round(
                      summaryData.wordCountData.reduce((sum, item) => sum + item.wordCount, 0) /
                        summaryData.wordCountData.length
                    )
                  : 0}
              </p>
            </div>
          </div>
          
          {/* Calendar Heatmap */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Entry Frequency Calendar</h2>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <div className="flex mb-2">
                  {months.map((month) => {
                    const [year, monthNum] = month.split('-');
                    const monthName = new Date(`${year}-${monthNum}-01`).toLocaleString('default', { month: 'short' });
                    return (
                      <div key={month} className="flex-1 text-center text-xs text-gray-500">
                        {monthName} {year}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-flow-col auto-cols-fr gap-1">
                  {calendarHeatMap.map((day) => {
                    // Calculate the color intensity based on count
                    const maxCount = Math.max(...calendarHeatMap.map(d => d.count), 1);
                    const intensity = day.count > 0 ? (day.count / maxCount) * 0.8 + 0.2 : 0;
                    const bgColor = day.count > 0 
                      ? `rgba(59, 130, 246, ${intensity})` 
                      : 'rgba(229, 231, 235, 0.5)';
                    
                    const date = new Date(day.date);
                    const dayOfWeek = date.toLocaleString('default', { weekday: 'short' });
                    
                    return (
                      <div
                        key={day.date}
                        className="w-4 h-4 rounded-sm cursor-pointer transition-colors"
                        style={{ backgroundColor: bgColor }}
                        title={`${day.date}: ${day.count} entries`}
                      />
                    );
                  })}
                </div>
              </div>
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
            
            {/* Entry Length by Category */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Average Entry Length by Category</h2>
              <div className="h-64">
                <Bar 
                  data={entryLengthChartData}
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
            
            {/* Time of Day Writing Patterns */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Time of Day Writing Patterns</h2>
              <div className="h-64">
                <Bar 
                  data={timeOfDayChartData}
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
            
            {/* Word Frequency Analysis */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Most Common Words</h2>
              <div className="h-64">
                <Bar 
                  data={wordFrequencyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
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
    </ScrollableContainer>
  );
}
