import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import React from "react";

interface AuthProtectedRouteProps {
  children: React.ReactNode;
}

export const AuthProtectedRoute = ({ children }: AuthProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if the user is logged in
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking auth:", error);
        setAuthenticated(false);
      } else {
        setAuthenticated(!!data.session);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Checking authentication...</div>;
  }

  if (!authenticated) {
    // If not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected component
  return <>{children}</>;
}; 