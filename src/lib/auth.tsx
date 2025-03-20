import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Session } from "next-auth";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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
const AuthContext = createContext<AuthContextType | null>(null);

// Context provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle sign in
  const handleSignIn = async (credentials: { email: string; password: string }) => {
    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Sign in error:", error);
      return false;
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Handle register
  const handleRegister = async (userData: { name: string; email: string; password: string }) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        return false;
      }

      // Automatically sign in after successful registration
      return await handleSignIn({
        email: userData.email,
        password: userData.password,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  // Check if user is admin
  const isAdmin = session?.user?.role === "ADMIN";

  // Context value
  const value = {
    user: session?.user ?? null,
    status,
    isAdmin,
    signIn: handleSignIn,
    signOut: handleSignOut,
    register: handleRegister,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
