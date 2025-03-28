import { useAuth } from "../context/auth-context";
import { LoginForm } from "../components/login-form";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const { loading } = useAuth();

  // While checking authentication, show loading
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Always show login form
  return (
    <div className="h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
