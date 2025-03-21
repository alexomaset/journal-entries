"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  FiUsers, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiCheck, 
  FiShield, 
  FiUser
} from "react-icons/fi";
import ScrollableContainer from "../../layout-components/ScrollableContainer";

// User types
type UserRole = "USER" | "ADMIN";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

// Form schema for editing users
const editUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["USER", "ADMIN"] as const),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

// Component for managing users (Admin only)
export default function UserManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Setup form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      id: "",
      name: "",
      email: "",
      role: "USER",
      password: "",
    },
  });

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      // Redirect non-admin users
      if (user.role !== "ADMIN") {
        toast.error("You don't have permission to access this page");
        router.push("/dashboard");
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/users");
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          toast.error("Failed to load users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("An error occurred while loading users");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [user, router]);

  // Handle edit user
  const handleEditUser = (user: User) => {
    reset({
      id: user.id,
      name: user.name || "",
      email: user.email,
      role: user.role as UserRole,
      password: "", // Don't prefill password
    });
    setShowEditModal(true);
  };
  
  // Submit user edit
  const onSubmitEdit = async (data: EditUserFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        toast.success("User updated successfully");
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An error occurred while updating user");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete user
  const handleDeleteUser = async (id: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== id));
        toast.success("User deleted successfully");
        setDeleteConfirmId(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting user");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // If not admin, don't show anything
  if (user && user.role !== "ADMIN") {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-center">
          <FiShield size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Admin Access Required</h2>
          <p className="mt-2 text-gray-600">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollableContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FiUsers className="mr-2" size={24} />
          User Management
        </h1>
      </div>
      
      {isLoading && users.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {userItem.name || "N/A"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {userItem.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        userItem.role === "ADMIN" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {userItem.role === "ADMIN" ? <FiShield className="mr-1" size={12} /> : <FiUser className="mr-1" size={12} />}
                        {userItem.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(userItem.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      {deleteConfirmId === userItem.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-red-600">Confirm delete?</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                            className="border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <FiX size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(userItem.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <FiCheck size={16} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUser(userItem)}
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <FiEdit2 size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(userItem.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={userItem.id === user?.id} // Cannot delete yourself
                          >
                            <FiTrash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-medium text-gray-900">Edit User</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={18} />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitEdit)} className="p-4">
              <input type="hidden" {...register("id")} />
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  {...register("name")}
                  error={errors.name?.message}
                  className="mt-1"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  error={errors.email?.message}
                  className="mt-1"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <div className="mt-1 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="USER"
                      {...register("role")}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">User</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="ADMIN"
                      {...register("role")}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Admin</span>
                  </label>
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password (leave blank to keep current)
                </label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  error={errors.password?.message}
                  className="mt-1"
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ScrollableContainer>
  );
}
