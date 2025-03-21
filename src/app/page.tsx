"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { FiBook, FiEdit, FiArrowRight } from "react-icons/fi";

export default function Home() {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-sm">
        <div className="text-xl font-semibold text-blue-600">Journal Entries</div>
        <nav>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <span className="inline-block mr-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                Dashboard
              </span>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <span className="inline-block mr-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                  Sign In
                </span>
              </Link>
              <Link href="/register">
                <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Sign Up
                </span>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Your Digital Journal Experience
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Capture your thoughts, track your growth, and reflect on your journey
          with our powerful and intuitive journaling platform.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mb-12">
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FiBook size={24} className="text-blue-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Create Entries</h2>
            <p className="text-gray-600">
              Write down your thoughts, ideas, and experiences in a secure and organized way.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FiEdit size={24} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Organize & Tag</h2>
            <p className="text-gray-600">
              Categorize your entries with custom tags and categories for easy retrieval and organization.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <FiArrowRight size={24} className="text-purple-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Track Progress</h2>
            <p className="text-gray-600">
              Visualize your journaling habits and discover insights about your writing patterns.
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center shadow-md hover:shadow-lg transition-shadow">
            Go to Dashboard
            <FiArrowRight className="ml-2" />
          </Link>
        ) : (
          <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center shadow-md hover:shadow-lg transition-shadow">
            Get Started
            <FiArrowRight className="ml-2" />
          </Link>
        )}
      </main>

      <footer className="w-full py-6 mt-auto bg-white border-t">
        <div className="max-w-5xl mx-auto px-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Journal Entries App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
