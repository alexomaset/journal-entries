"use client";
import { createContext, useContext, ReactNode } from "react";
import { Session } from "next-auth";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Define auth context types
type AuthContextType = {
  user: (Session["user"] & { id?: string; role?: string }) | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isAdmin: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>;
};

// Create the context
const AuthContext = createContext<AuthContextType>({
  user: null,
  status: "unauthenticated",
  isAdmin: false,
  signIn: async () => false,
  signOut: async () => {},
  register: async () => false,
});

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Include user role and ID from the session
  const user = session?.user as (Session["user"] & { id?: string; role?: string }) | null;
  
  // Check if the user has admin role
  const isAdmin = user?.role === "ADMIN";
  
  // Sign in function
  const handleSignIn = async (credentials: { email: string; password: string }) => {
    try {
      const result = await nextAuthSignIn("credentials", {
        ...credentials,
        redirect: false,
      });
      
      if (result?.error) {
        toast.error(result.error || "Failed to sign in");
        return false;
      }
      
      toast.success("Signed in successfully");
      router.push("/dashboard");
      return true;
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An error occurred during sign in");
      return false;
    }
  };
  
  // Sign out function
  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      router.push("/login");
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("An error occurred during sign out");
    }
  };
  
  // Register function
  const handleRegister = async (userData: { name: string; email: string; password: string }) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return false;
      }
      
      // Sign in the user after successful registration
      await handleSignIn({
        email: userData.email,
        password: userData.password,
      });
      
      toast.success("Registration successful");
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration");
      return false;
    }
  };
  
  // Provide the auth context
  const value = {
    user,
    status,
    isAdmin,
    signIn: handleSignIn,
    signOut: handleSignOut,
    register: handleRegister,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
