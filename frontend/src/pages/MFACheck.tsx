import { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import { AuthMFA, EnrollMFA } from "../components/MFA";
import LandingPage from "./LandingPage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

const MFACheck = () => {
  const [readyToShow, setReadyToShow] = useState(true); // Always true as per requirement
  const [isMFARegistered, setIsMFARegistered] = useState(false);
  const [isMFAVerified, setIsMFAVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { refreshAuthState } = useAuth();

  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        // Check if user has MFA factors registered
        const { data, error } = await supabase.auth.mfa.listFactors();

        if (error) throw error;

        // Check if there are any TOTP factors
        const hasTOTP = data.totp && data.totp.length > 0;
        setIsMFARegistered(hasTOTP);
      } catch (error) {
        console.error("Error checking MFA status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMFAStatus();
  }, []);

  const handleMFAEnrolled = async () => {
    console.log("MFA enrolled, handling enrollment completion");
    setIsMFARegistered(true);

    try {
      // Refresh auth state to ensure token synchronization
      await refreshAuthState();

      // Then navigate to dashboard after enrollment
      navigate("/landing");
    } catch (error) {
      console.error("Error refreshing auth state after MFA enrollment:", error);
      // Still attempt to navigate to landing
      navigate("/landing");
    }
  };

  const handleMFAVerified = async () => {
    console.log("MFA verified, handling verification completion");
    setIsMFAVerified(true);

    try {
      // Refresh auth state to ensure token synchronization
      await refreshAuthState();

      // Then navigate to landing after verification
      navigate("/landing");
    } catch (error) {
      console.error(
        "Error refreshing auth state after MFA verification:",
        error
      );
      // Still attempt to navigate to landing
      navigate("/landing");
    }
  };

  if (isLoading) {
    return <div>Checking authentication status...</div>;
  }

  if (readyToShow) {
    if (isMFAVerified) {
      return <LandingPage />;
    }

    if (isMFARegistered) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="p-6 bg-white rounded shadow-md w-96">
            <h2 className="text-xl font-bold mb-4">
              Complete Two-Factor Authentication
            </h2>
            <AuthMFA onVerificationComplete={handleMFAVerified} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 bg-white rounded shadow-md w-96">
          <h2 className="text-xl font-bold mb-4">
            Set Up Two-Factor Authentication
          </h2>
          <p className="mb-4">
            For security purposes, you need to set up two-factor authentication.
          </p>
          <EnrollMFA
            onEnrolled={handleMFAEnrolled}
            onCancelled={() => {
              /* Handle cancellation - possibly log out */
            }}
          />
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default MFACheck;
