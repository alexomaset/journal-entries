"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth";
import { FiUser, FiSettings, FiMoon, FiSun, FiMail, FiLock, FiSave, FiRefreshCw } from "react-icons/fi";
import ScrollableContainer from "../layout-components/ScrollableContainer";
import { useTheme } from "@/providers/ThemeProvider";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  // If any password field is filled, all password fields must be filled
  if (data.currentPassword || data.newPassword || data.confirmPassword) {
    return !!data.currentPassword && !!data.newPassword && !!data.confirmPassword;
  }
  return true;
}, {
  message: "All password fields are required when changing password",
  path: ["currentPassword"],
}).refine((data) => {
  // New password and confirm password must match
  if (data.newPassword && data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Settings form schema
const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifyEmail: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type SettingsFormValues = z.infer<typeof settingsSchema>;

// User type
type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  settings: {
    id: string;
    theme: string;
    notifyEmail: boolean;
  } | null;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "preferences">("profile");
  const [userData, setUserData] = useState<User | null>(null);

  // Setup profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Setup settings form
  const {
    register: registerSettings,
    handleSubmit: handleSubmitSettings,
    reset: resetSettings,
    watch: watchSettings,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: "light",
      notifyEmail: false,
    },
  });
  
  // Watch the theme value for immediate preview
  const currentTheme = watchSettings("theme");

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const response = await fetch("/api/user/settings");
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          
          // Set profile form values
          resetProfile({
            name: data.name || "",
            email: data.email,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          
          // Set settings form values
          resetSettings({
            theme: data.settings?.theme || "light",
            notifyEmail: data.settings?.notifyEmail || false,
          });
        } else {
          toast.error("Failed to load user settings");
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
        toast.error("An error occurred while loading settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, resetProfile, resetSettings]);

  // Handle profile form submission
  const onSubmitProfile = async (data: ProfileFormValues) => {
    setIsLoading(true);
    
    try {
      // Prepare profile data
      const profileData = {
        name: data.name,
        email: data.email,
      };
      
      // Include password data if provided
      if (data.currentPassword && data.newPassword) {
        Object.assign(profileData, {
          currentPassword: data.currentPassword,
          password: data.newPassword,
        });
      }
      
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: profileData,
        }),
      });
      
      if (response.ok) {
        toast.success("Profile updated successfully");
        
        // Reset password fields
        resetProfile({
          ...data,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle settings form submission
  const onSubmitSettings = async (data: SettingsFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: data,
        }),
      });
      
      if (response.ok) {
        toast.success("Preferences updated successfully");
        
        // Apply theme change immediately without requiring page refresh
        setTheme(data.theme as "light" | "dark" | "system");
        
        // Update local state to reflect new settings
        if (userData) {
          setUserData({
            ...userData,
            settings: {
              ...userData.settings,
              theme: data.theme,
              notifyEmail: data.notifyEmail,
            } as any
          });
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("An error occurred while updating preferences");
    } finally {
      setIsLoading(false);
    }
  };

  // Instantly preview theme change when selecting an option
  const handleThemePreview = (theme: "light" | "dark" | "system") => {
    // Apply theme change for preview
    setTheme(theme);
  };

  return (
    <ScrollableContainer>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      
      {/* Tabs */}
      <div className="mb-6 flex border-b">
        <button
          className={`flex items-center px-4 py-2 ${
            activeTab === "profile"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          <FiUser className="mr-2" size={16} />
          Profile
        </button>
        <button
          className={`flex items-center px-4 py-2 ${
            activeTab === "preferences"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("preferences")}
        >
          <FiSettings className="mr-2" size={16} />
          Preferences
        </button>
      </div>
      
      {isLoading && !userData ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      ) : (
        <>
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                <FiUser className="mr-2 inline" size={18} />
                Personal Information
              </h2>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    {...registerProfile("name")}
                    error={profileErrors.name?.message}
                    className="mt-1"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile("email")}
                    error={profileErrors.email?.message}
                    className="mt-1"
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    <FiLock className="mr-2 inline" size={16} />
                    Change Password
                  </h3>
                  
                  {/* Current Password */}
                  <div className="mb-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...registerProfile("currentPassword")}
                      error={profileErrors.currentPassword?.message}
                      className="mt-1"
                    />
                  </div>
                  
                  {/* New Password */}
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...registerProfile("newPassword")}
                      error={profileErrors.newPassword?.message}
                      className="mt-1"
                    />
                  </div>
                  
                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...registerProfile("confirmPassword")}
                      error={profileErrors.confirmPassword?.message}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 mr-2"
                  >
                    <FiSave className="mr-2" size={16} />
                    {isLoading ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          {/* Preferences Settings */}
          {activeTab === "preferences" && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                <FiSettings className="mr-2 inline" size={18} />
                Application Preferences
              </h2>
              <form onSubmit={handleSubmitSettings(onSubmitSettings)} className="space-y-6">
                {/* Theme Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <label 
                      className="flex flex-col items-center justify-center rounded-lg border p-4 cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => handleThemePreview("light")}
                    >
                      <input
                        type="radio"
                        value="light"
                        {...registerSettings("theme")}
                        className="sr-only"
                      />
                      <FiSun
                        size={24}
                        className={`mb-2 ${
                          currentTheme === "light" ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                      <span className={`text-sm ${
                        currentTheme === "light" ? "font-medium text-blue-500" : "text-gray-700"
                      }`}>
                        Light
                      </span>
                    </label>
                    <label 
                      className="flex flex-col items-center justify-center rounded-lg border p-4 cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => handleThemePreview("dark")}
                    >
                      <input
                        type="radio"
                        value="dark"
                        {...registerSettings("theme")}
                        className="sr-only"
                      />
                      <FiMoon
                        size={24}
                        className={`mb-2 ${
                          currentTheme === "dark" ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                      <span className={`text-sm ${
                        currentTheme === "dark" ? "font-medium text-blue-500" : "text-gray-700"
                      }`}>
                        Dark
                      </span>
                    </label>
                    <label 
                      className="flex flex-col items-center justify-center rounded-lg border p-4 cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => handleThemePreview("system")}
                    >
                      <input
                        type="radio"
                        value="system"
                        {...registerSettings("theme")}
                        className="sr-only"
                      />
                      <FiRefreshCw
                        size={24}
                        className={`mb-2 ${
                          currentTheme === "system" ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                      <span className={`text-sm ${
                        currentTheme === "system" ? "font-medium text-blue-500" : "text-gray-700"
                      }`}>
                        System
                      </span>
                    </label>
                  </div>
                </div>
                
                {/* Email Notifications */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...registerSettings("notifyEmail")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      <FiMail className="mr-1 inline" size={14} />
                      Send me email notifications about my journal reminders
                    </span>
                  </label>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FiSave className="mr-2" size={16} />
                    {isLoading ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </ScrollableContainer>
  );
}
