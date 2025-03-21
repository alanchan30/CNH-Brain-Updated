import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth-context.tsx";

// Auth wrapper component to check authentication
const AuthWrapper = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // You could add a loading indicator here
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && window.location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthWrapper />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
