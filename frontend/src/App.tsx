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
import LandingPage from "./pages/LandingPage";
import History from "./pages/HistoryPage";
import Upload from "./pages/Upload";
import ResultsPage from "./pages/ResultsPage";
import NotFoundPage from "./pages/404";

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
