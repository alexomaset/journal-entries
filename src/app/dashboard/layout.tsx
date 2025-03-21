"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  FiBook, 
  FiHome, 
  FiPlus, 
  FiTag, 
  FiPieChart, 
  FiSettings, 
  FiLogOut,
  FiUsers,
  FiShield
} from "react-icons/fi";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Navigation items
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <FiHome size={18} /> },
    { href: "/dashboard/journals", label: "Journals", icon: <FiBook size={18} /> },
    { href: "/dashboard/journals/new", label: "New Entry", icon: <FiPlus size={18} /> },
    { href: "/dashboard/categories", label: "Categories", icon: <FiTag size={18} /> },
    { href: "/dashboard/summary", label: "Summary", icon: <FiPieChart size={18} /> },
    { href: "/dashboard/settings", label: "Settings", icon: <FiSettings size={18} /> },
  ];

  // Admin navigation items (only shown to admin users)
  const adminNavItems = [
    { href: "/dashboard/admin/users", label: "Users", icon: <FiUsers size={18} /> },
  ];

  // Check if the current path matches the nav item
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-md">
        <div className="flex h-16 items-center justify-center border-b">
          <h1 className="text-xl font-bold text-gray-900">Journal Entries</h1>
        </div>
        
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Admin Section (only shown to admin users) */}
          {user?.role === "ADMIN" && (
            <>
              <div className="mt-6 border-t pt-4">
                <div className="mb-2 px-4 text-xs font-semibold uppercase text-gray-500">
                  <span className="flex items-center">
                    <FiShield className="mr-1" size={12} />
                    Admin
                  </span>
                </div>
                <ul className="space-y-2">
                  {adminNavItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          
          <div className="mt-6 border-t pt-4">
            <Button
              variant="ghost"
              className="flex w-full items-center justify-start px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => signOut()}
            >
              <FiLogOut size={18} className="mr-3" />
              Sign out
            </Button>
          </div>
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {pathname === "/dashboard" && "Dashboard"}
            {pathname === "/dashboard/journals" && "Journal Entries"}
            {pathname === "/dashboard/journals/new" && "New Journal Entry"}
            {pathname.startsWith("/dashboard/journals/edit/") && "Edit Journal Entry"}
            {pathname === "/dashboard/categories" && "Categories"}
            {pathname === "/dashboard/summary" && "Summary"}
            {pathname === "/dashboard/settings" && "Settings"}
            {pathname === "/dashboard/admin/users" && "User Management"}
          </h2>
          <div className="flex items-center">
            {user?.role === "ADMIN" && (
              <span className="mr-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                Admin
              </span>
            )}
            <span className="mr-4 text-sm text-gray-600">
              {user?.name || user?.email}
            </span>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
