import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { API_URL } from "@/components/constants";
interface User {
  id: string;
  email: string;
  [key: string]: any; // For additional user properties
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is authenticated on component mount
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to authenticate: ${response.status}`);
        }

        const userData = await response.json();
        setUser(userData.user || userData); // Handle different response formats
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        // Token is invalid or expired
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    const token = localStorage.getItem("access_token");

    if (token) {
      try {
        // Make sure we're using the correct endpoint
        const response = await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Error during sign out:", await response.text());
        }
      } catch (error) {
        console.error("Error during sign out:", error);
      }
    }

    // Clear local storage regardless of API response
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setIsAuthenticated(false);

    // Navigate to login page after logout
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
