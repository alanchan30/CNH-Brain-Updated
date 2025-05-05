import { supabase } from "@/components/supabaseClient";

/**
 * Ensures we're storing tokens consistently across the app
 */
export const storeAuthTokens = (accessToken: string, refreshToken: string) => {
  if (!accessToken || !refreshToken) {
    console.error("Attempted to store empty tokens");
    return false;
  }
  
  try {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    return true;
  } catch (error) {
    console.error("Failed to store auth tokens:", error);
    return false;
  }
};

/**
 * Clears all authentication tokens and session data
 */
export const clearAuthTokens = () => {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return true;
  } catch (error) {
    console.error("Failed to clear auth tokens:", error);
    return false;
  }
};

/**
 * Get stored tokens
 */
export const getStoredTokens = () => {
  try {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Failed to get stored tokens:", error);
    return { accessToken: null, refreshToken: null };
  }
};

/**
 * Try to refresh the session with stored tokens
 */
export const refreshSession = async () => {
  try {
    const { refreshToken } = getStoredTokens();
    
    if (!refreshToken) {
      return { success: false, error: new Error("No refresh token available") };
    }
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error) {
      clearAuthTokens();
      return { success: false, error };
    }
    
    if (data.session) {
      storeAuthTokens(data.session.access_token, data.session.refresh_token);
      return { success: true, session: data.session, user: data.user };
    }
    
    return { success: false, error: new Error("Session refresh returned no session") };
  } catch (error) {
    console.error("Session refresh failed:", error);
    clearAuthTokens();
    return { success: false, error };
  }
};

/**
 * Check if MFA is required for the current user
 */
export const checkMFAStatus = async () => {
  try {
    // Check authenticator assurance level
    const { data: aalData, error: aalError } = 
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (aalError) {
      console.error("Error checking AAL:", aalError);
      return { requiresMFA: false, error: aalError };
    }
    
    // Check MFA factors
    const { data: factorsData, error: factorsError } = 
      await supabase.auth.mfa.listFactors();
    
    if (factorsError) {
      console.error("Error listing factors:", factorsError);
      return { requiresMFA: false, error: factorsError };
    }
    
    const hasMFAEnrolled = factorsData.totp && factorsData.totp.length > 0;
    const isAAL2 = aalData.currentLevel === 'aal2';
    
    // User requires MFA if they have factors enrolled but aren't at AAL2,
    // or if they don't have factors enrolled yet (need to set up MFA)
    const requiresMFA = !hasMFAEnrolled || !isAAL2;
    
    return { 
      requiresMFA,
      hasMFAEnrolled,
      currentAAL: aalData.currentLevel,
      factors: factorsData
    };
  } catch (error) {
    console.error("Failed to check MFA status:", error);
    return { requiresMFA: false, error };
  }
}; 