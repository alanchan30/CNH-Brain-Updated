import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { API_URL } from "@/components/constants";
import { supabase } from "@/components/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { storeAuthTokens, clearAuthTokens, getStoredTokens, refreshSession, checkMFAStatus } from "@/utils/auth";

// Define User type compatible with Supabase user
interface User {
  id: string;
  email: string | undefined;
  [key: string]: any; // For additional user properties
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  requiresMFA: boolean;
  refreshAuthState: () => Promise<{isAuthenticated: boolean, requiresMFA: boolean} | void>;
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

  // Function to convert Supabase user to our User type
  const convertUser = (supabaseUser: SupabaseUser): User => {
    const { id, email, ...rest } = supabaseUser;
    return {
      id,
      email,
      ...rest
    };
  };

  // Function to check auth state that can be reused
  const checkAuthState = async () => {
    // Don't set loading here to avoid unnecessary rerenders
    
    try {
      // First try to get session from Supabase directly
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        throw sessionError;
      }
      
      if (session) {
        // If we have a session already, use it
        storeAuthTokens(session.access_token, session.refresh_token);
        
        // Get user from Supabase directly
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error getting user:", userError);
          throw userError;
        }
        
        if (supabaseUser) {
          setUser(convertUser(supabaseUser));
          setIsAuthenticated(true);
          
          // Check MFA status using the utility function
          try {
            const mfaStatus = await checkMFAStatus();
            setRequiresMFA(mfaStatus.requiresMFA);
          } catch (mfaError) {
            console.error("MFA check error:", mfaError);
            // Fail gracefully on MFA errors
            setRequiresMFA(false);
          }
          
          setLoading(false);
          return { isAuthenticated: true, requiresMFA: requiresMFA };
        }
      } 
      
      // No existing session, try to refresh
      const { success, session: refreshedSession, user: refreshedUser, error: refreshError } = await refreshSession();
      
      if (success && refreshedSession && refreshedUser) {
        setUser(convertUser(refreshedUser));
        setIsAuthenticated(true);
        
        // Check MFA status for refreshed session
        try {
          const mfaStatus = await checkMFAStatus();
          setRequiresMFA(mfaStatus.requiresMFA);
        } catch (mfaError) {
          console.error("MFA check error after refresh:", mfaError);
          setRequiresMFA(false);
        }
        
        setLoading(false);
        return { isAuthenticated: true, requiresMFA: requiresMFA };
      }
      
      // Last resort: try the API with stored tokens
      const { accessToken } = getStoredTokens();
      
      if (accessToken) {
        try {
          const response = await fetch(`${API_URL}/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to authenticate: ${response.status}`);
          }

          const userData = await response.json();
          setUser(userData.user || userData);
          setIsAuthenticated(true);
          setLoading(false);
          return { isAuthenticated: true, requiresMFA: false };
        } catch (apiError) {
          console.error("API verification failed:", apiError);
          clearAuthTokens();
        }
      }
      
      // If we reach here, we have no valid session
      setUser(null);
      setIsAuthenticated(false);
      setRequiresMFA(false);
      setLoading(false);
      return { isAuthenticated: false, requiresMFA: false };
      
    } catch (error) {
      console.error("Authentication check failed:", error);
      // Token is invalid or expired
      clearAuthTokens();
      setUser(null);
      setIsAuthenticated(false);
      setRequiresMFA(false);
      setLoading(false);
      
      return { isAuthenticated: false, requiresMFA: false };
    }
  };

  // Public function to refresh auth state (e.g. after MFA verification)
  const refreshAuthState = async () => {
    setLoading(true);
    return await checkAuthState();
  };

  useEffect(() => {
    // Check if user is authenticated on component mount
    setLoading(true);
    checkAuthState();
    
    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Update localStorage with new tokens when session changes
        storeAuthTokens(session.access_token, session.refresh_token);
        
        // Set auth state from session
        setIsAuthenticated(true);
        const user = session.user;
        if (user) {
          setUser(convertUser(user));
        }
        setLoading(false);
      } else {
        // On logout, clear everything
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { accessToken } = getStoredTokens();

    if (accessToken) {
      try {
        // Make sure we're using the correct endpoint
        const response = await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
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

    // Clear tokens and supabase session
    await supabase.auth.signOut();
    clearAuthTokens();
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
