import { useAuth } from "../context/auth-context";
import { LoginForm } from "../components/login-form";
import { useNavigate, Navigate } from "react-router-dom";
import { useEffect } from "react";

const LoginPage = () => {
  const { loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && isAuthenticated) {
      navigate("/landing");
    }
  }, [isAuthenticated, navigate]);

  // While checking authentication, show loading
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // If already authenticated, redirect to landing
  if (isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  // Show login form if not authenticated
  return (
    <div className="h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
