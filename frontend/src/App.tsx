import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth-context";
import { useEffect } from "react";
import { supabase } from "./components/supabaseClient";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MFACheck from "./pages/MFACheck";
import LandingPage from "./pages/LandingPage";
import History from "./pages/HistoryPage";
import Upload from "./pages/Upload";
import ResultsPage from "./pages/ResultsPage";
import NotFoundPage from "./pages/404";

// Component to handle auth token refreshing
const AuthMiddleware = ({ children }: { children: React.ReactNode }) => {
  const { refreshAuthState, loading, isAuthenticated, requiresMFA } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const isMFAPage = location.pathname === '/mfa';
  
  useEffect(() => {
    // Skip refreshing on login page - we'll handle auth there
    if (isLoginPage) {
      return;
    }
    
    let isRefreshing = false;
    const refreshToken = async () => {
      // Prevent concurrent refresh attempts
      if (isRefreshing) return;
      isRefreshing = true;
      
      try {
        // Only refresh if we have tokens or we're on a protected route
        const hasTokens = localStorage.getItem("access_token") || 
                         localStorage.getItem("refresh_token");
        
        if (hasTokens) {
          // Try to refresh with Supabase directly first
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session) {
            // Store tokens in localStorage
            localStorage.setItem("access_token", session.access_token);
            localStorage.setItem("refresh_token", session.refresh_token);
          } else if (!error) {
            // No session but no error either, try refreshing once
            await refreshAuthState();
          }
        }
      } catch (err) {
        console.error("Failed to refresh auth:", err);
      } finally {
        isRefreshing = false;
      }
    };
    
    refreshToken();
    // Only run this when the pathname changes, not on every render
  }, [location.pathname]);
  
  // Redirect to MFA page if needed
  useEffect(() => {
    if (isAuthenticated && requiresMFA && !isMFAPage && !isLoginPage) {
      navigate("/mfa");
    }
  }, [isAuthenticated, requiresMFA, isMFAPage, isLoginPage, navigate]);
  
  // Show loading state for protected routes only
  if (loading && !isLoginPage) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading your session...</div>
      </div>
    );
  }
  
  return <>{children}</>;
};

const ProtectedRoute = ({
  children,
  requireMFA = true,
}: {
  children: React.ReactNode;
  requireMFA?: boolean;
}) => {
  const { isAuthenticated, loading, requiresMFA } = useAuth();

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

  if (requireMFA && requiresMFA && window.location.pathname !== "/mfa") {
    return <Navigate to="/mfa" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AuthMiddleware>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mfa" element={<MFACheck />} />

            {/* Protected Routes */}
            <Route
              path="/landing"
              element={
                <ProtectedRoute>
                  <LandingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/results/:id"
              element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to landing */}
            <Route path="/" element={<Navigate to="/landing" replace />} />

            {/* 404 Route */}
            <Route path="/404" element={<NotFoundPage />} />

            {/* Catch all undefined routes */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthMiddleware>
      </Router>
    </AuthProvider>
  );
};

const AuthCheck = ({
  children,
  requireFullAuth = true,
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
