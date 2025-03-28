import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { API_URL } from "@/components/constants";
import { supabase } from "@/components/supabaseClient";

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
  requiresMFA: boolean;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [requiresMFA, setRequiresMFA] = useState<boolean>(false);

  // Function to check auth state that can be reused
  const checkAuthState = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setIsAuthenticated(false);
      setRequiresMFA(false);
      return;
    }

    try {
      // First check if the token is valid
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to authenticate: ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData.user || userData);
      setIsAuthenticated(true);

      // Then check MFA status
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      // Check if user has MFA factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const hasMFAEnrolled = factorsData.totp && factorsData.totp.length > 0;
      const isAAL2 = aalData.currentLevel === 'aal2';

      // Require MFA if not enrolled or not at AAL2 level
      const needsMFA = !hasMFAEnrolled || !isAAL2;
      setRequiresMFA(needsMFA);
      
      console.log('Auth state refreshed:', { 
        isAuthenticated: true, 
        requiresMFA: needsMFA,
        authLevel: aalData.currentLevel
      });
      
      return { isAuthenticated: true, requiresMFA: needsMFA };

    } catch (error) {
      console.error("Authentication check failed:", error);
      // Token is invalid or expired
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setIsAuthenticated(false);
      setRequiresMFA(false);
      
      return { isAuthenticated: false, requiresMFA: false };
    }
  };

  // Public function to refresh auth state (e.g. after MFA verification)
  const refreshAuthState = async () => {
    setLoading(true);
    try {
      await checkAuthState();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated on component mount
    const initialAuthCheck = async () => {
      setLoading(true);
      try {
        await checkAuthState();
      } finally {
        setLoading(false);
      }
    };

    initialAuthCheck();
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
            "Content-Type": "application/json"
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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signOut, 
      isAuthenticated, 
      requiresMFA,
      refreshAuthState 
    }}>
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
