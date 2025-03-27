import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth-context";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MFACheck from "./pages/MFACheck";

// ... other imports

const ProtectedRoute = ({ children, requireMFA = true }: { 
  children: React.ReactNode;
  requireMFA?: boolean;
}) => {
  const { isAuthenticated, loading, requiresMFA } = useAuth(); // Now requiresMFA is defined in context

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only redirect if MFA is required by both the route and the user's status
  // Check current path to prevent infinite redirects
  if (requireMFA && requiresMFA && window.location.pathname !== '/mfa') {
    return <Navigate to="/mfa" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mfa" element={<MFACheck/>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const AuthCheck = ({ 
  children, 
  requireFullAuth = true 
}: { 
  children: React.ReactNode;
  requireFullAuth?: boolean;
}) => {
  const { isAuthenticated } = useAuth();
  const hasToken = !!localStorage.getItem("access_token");
  
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireFullAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default App;