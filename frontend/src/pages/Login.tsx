import { useAuth } from "../context/auth-context";
import { LoginForm } from "../components/login-form";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const LoginPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  // While checking authentication, show loading
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // If not authenticated, show login form
  return (
    <div className="h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
