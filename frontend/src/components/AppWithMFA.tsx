import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient"; // Adjust the path to your supabase client
import App from "../App"; // Adjust the path to your main App component
import { AuthMFA, EnrollMFA } from "./MFA"; // Import your MFA components
import LandingPage from "@/pages/LandingPage";

export function AppWithMFA() {
  const [readyToShow, setReadyToShow] = useState(true); // Always ready to show
  const [showMFAScreen, setShowMFAScreen] = useState(true); // Always show MFA screen initially
  const [mfaEnrolled, setMfaEnrolled] = useState(false); // Track if user has MFA enrolled
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    // Check if user has MFA enrolled
    const checkMFAStatus = async () => {
      try {
        // Get the current authentication level
        const { data: aalData, error: aalError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) throw aalError;

        // Check if user already has MFA factors
        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        // If user has TOTP factors, they have MFA enrolled
        const hasMFAEnrolled = factorsData.totp && factorsData.totp.length > 0;
        setMfaEnrolled(hasMFAEnrolled);

        // If user is already at AAL2 level, they don't need MFA verification
        if (aalData.currentLevel === "aal2") {
          setShowMFAScreen(false);
        }
      } catch (error) {
        console.error("Error checking MFA status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkMFAStatus();
  }, []);

  // When MFA enrollment is complete
  const handleEnrollmentComplete = async () => {
    try {
      // When enrollment is complete, check the current authentication level
      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      console.log("After enrollment, auth level:", aalData.currentLevel);

      // If user is already at AAL2 after enrollment, they can skip the verification screen
      if (aalData.currentLevel === "aal2") {
        console.log("User already at AAL2, skipping verification screen");
        setMfaEnrolled(true);
        setShowMFAScreen(false); // Skip the verification screen
      } else {
        // Otherwise, just mark MFA as enrolled and show verification screen
        console.log("User needs verification, showing verification screen");
        setMfaEnrolled(true);
      }
    } catch (error) {
      console.error(
        "Error checking authentication level after enrollment:",
        error
      );
      // Fall back to default behavior
      setMfaEnrolled(true);
    }
  };

  // When MFA verification is complete
  const handleVerificationComplete = () => {
    setShowMFAScreen(false);
  };

  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // If ready to show and MFA screen needed
  if (readyToShow && showMFAScreen) {
    // Show enrollment if not enrolled, or verification if enrolled
    return mfaEnrolled ? (
      <AuthMFA onVerificationComplete={handleVerificationComplete} />
    ) : (
      <EnrollMFA
        onEnrolled={handleEnrollmentComplete}
        onCancelled={() => {
          /* Handle cancellation - possibly log out */
        }}
      />
    );
  }

  // If MFA is complete, show the main dashboard
  return <LandingPage />;
}

export default AppWithMFA;
