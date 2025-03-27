import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient' // Adjust the path to your supabase client
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TopRoundedCard,
  RoundedCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

/**
 * EnrollMFA shows a simple enrollment dialog. When shown on screen it calls
 * the `enroll` API. Each time a user clicks the Enable button it calls the
 * `challenge` and `verify` APIs to check if the code provided by the user is
 * valid.
 * When enrollment is successful, it calls `onEnrolled`. When the user clicks
 * Cancel the `onCancelled` callback is called.
 */
export function EnrollMFA({
  onEnrolled,
  onCancelled,
}: {
  onEnrolled: () => void
  onCancelled: () => void
}) {
  const [factorId, setFactorId] = useState('')
  const [qr, setQR] = useState('') // holds the QR code image SVG
  const [verifyCode, setVerifyCode] = useState('') // contains the code entered by the user
  const [error, setError] = useState('') // holds an error message
  const [isLoading, setIsLoading] = useState(true) // tracks loading state
  const [isVerifying, setIsVerifying] = useState(false) // tracks verification state
  const [enrollmentAttempt, setEnrollmentAttempt] = useState(0) // tracks enrollment attempts
  const navigate = useNavigate();
  const enrollmentComplete = useRef(false);

  const handleCancel = () => {
    // Simply navigate to login without clearing anything
    console.log("Redirecting to login page without clearing session");
    
    // Call onCancelled callback
    onCancelled();
    
    // Navigate to login page
    window.location.href = "/login";
  };

  const onEnableClicked = () => {
    setError('')
    setIsVerifying(true)
    ;(async () => {
      try {
        console.log("Starting MFA enrollment verification...");
        
        // Get current user ID to access correct localStorage items
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session || !sessionData.session.user) {
          console.error("Session error:", sessionError);
          setError("Authentication required. Please log in again.");
          setIsVerifying(false);
          return;
        }
        
        const userId = sessionData.session.user.id;
        const factorIdKey = `mfa_factor_id_${userId}`;
        const qrCodeKey = `mfa_qr_code_${userId}`;
        
        const challenge = await supabase.auth.mfa.challenge({ factorId })
        if (challenge.error) {
          console.error("Challenge error:", challenge.error);
          setError(challenge.error.message);
          setIsVerifying(false);
          return;
        }

        const challengeId = challenge.data.id;
        console.log("Challenge created, ID:", challengeId);

        const verify = await supabase.auth.mfa.verify({
          factorId,
          challengeId,
          code: verifyCode,
        })
        if (verify.error) {
          console.error("Verification error:", verify.error);
          setError(verify.error.message);
          setIsVerifying(false);
          return;
        }

        console.log("Verification successful, getting session...");
        
        // Get session after successful verification to update AAL level
        const { data: updatedSessionData, error: updatedSessionError } = await supabase.auth.getSession();
        
        if (updatedSessionError) {
          console.error("Session error:", updatedSessionError);
          setError("Verification successful but session error occurred");
          setIsVerifying(false);
          return;
        }
        
        // Update tokens with the current session to ensure consistency
        if (updatedSessionData.session) {
          console.log("Updating tokens with current session");
          localStorage.setItem("access_token", updatedSessionData.session.access_token);
          localStorage.setItem("refresh_token", updatedSessionData.session.refresh_token);
          
          // Make sure Supabase client uses the updated tokens
          await supabase.auth.setSession({
            access_token: updatedSessionData.session.access_token,
            refresh_token: updatedSessionData.session.refresh_token
          });
        }
        
        // MFA has been successfully set up and verified
        console.log("MFA successfully enrolled and verified");
        
        // Clean up temporary MFA setup data with user-specific keys
        localStorage.removeItem(factorIdKey);
        localStorage.removeItem(qrCodeKey);
        localStorage.removeItem('temp_totp_secret');
        
        // Set MFA verified flags
        localStorage.setItem("mfa_verified", "true");
        localStorage.setItem("mfa_enrolled", "true");
        localStorage.setItem("mfa_verified_at", new Date().toISOString());
        
        // Call the completion callback
        onEnrolled();
        
      } catch (error) {
        console.error("Unexpected error during MFA setup:", error);
        setError("An unexpected error occurred. Please try again.");
        setIsVerifying(false);
        // Go to login on unexpected errors
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500); // Allow time to see the error message
      }
    })()
  }

  useEffect(() => {
    // First, check if we have a valid session and get the user ID
    (async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          console.error('No valid session for MFA enrollment:', sessionError);
          setError('Authentication required. Please log in again.');
          setIsLoading(false);
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
          return;
        }
        
        // Get the current user ID to make localStorage keys user-specific
        const userId = sessionData.session.user.id;
        if (!userId) {
          console.error('User ID not found in session');
          setError('User authentication error');
          setIsLoading(false);
          return;
        }
        
        // Create user-specific localStorage keys
        const factorIdKey = `mfa_factor_id_${userId}`;
        const qrCodeKey = `mfa_qr_code_${userId}`;
        
        // Check for existing QR code in localStorage with user-specific keys
        const storedFactorId = localStorage.getItem(factorIdKey);
        const storedQR = localStorage.getItem(qrCodeKey);
        
        // If we have stored values for this specific user, use them
        if (storedFactorId && storedQR) {
          console.log('Using stored MFA setup data for user');
          setFactorId(storedFactorId);
          setQR(storedQR);
          setIsLoading(false);
          enrollmentComplete.current = true;
          return;
        }
        
        // Check if there are existing MFA factors
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          console.error('Error listing MFA factors:', factorsError);
          setError('Failed to check existing MFA factors');
          setIsLoading(false);
          return;
        }
        
        // If there are already verified factors, we don't need to enroll again
        if (factorsData.totp && factorsData.totp.length > 0) {
          const verifiedFactors = factorsData.totp.filter(factor => factor.status === 'verified');
          if (verifiedFactors.length > 0) {
            console.log('User already has verified MFA factors');
            setError('MFA is already set up for this account');
            setIsLoading(false);
            return;
          }
          
          // Use the first unverified factor if available
          const pendingFactors = factorsData.totp.filter(factor => factor.status !== 'verified');
          if (pendingFactors.length > 0) {
            console.log('Found pending MFA factor, using it');
            setFactorId(pendingFactors[0].id);
            // We'll need to request the QR code again since it's not stored
            try {
              // Try to get the factor details which might include the QR code
              const { data: factorData, error: factorError } = await supabase.auth.mfa.challenge({ 
                factorId: pendingFactors[0].id 
              });
              
              if (factorError) {
                console.error('Error getting factor details:', factorError);
                // Fall through to creating a new enrollment
              } else if (factorData) {
                // We have the factor data, but we may not have the QR code
                // Let's create a new enrollment instead to ensure we get a fresh QR code
                console.log('Successfully retrieved factor data');
              }
            } catch (err) {
              console.error('Error getting factor details:', err);
              // Fall through to creating a new enrollment
            }
          }
        }
        
        // Proceed with enrollment
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
        })
        console.log(`MFA enrollment completed`);
        
        if (error) {
          console.error('MFA enrollment error:', error);
          setError(error.message || 'Failed to enroll MFA');
          setIsLoading(false);
          return;
        }

        // Store factor ID in state and localStorage with user-specific key
        setFactorId(data.id);
        localStorage.setItem(factorIdKey, data.id);
        enrollmentComplete.current = true;

        // Handle QR code
        try {
          const qrCode = data.totp.qr_code;
          console.log('QR code data received');
          
          let finalQRCode = '';
          
          // If the QR code is already a data URL, use it directly
          if (qrCode.startsWith('data:')) {
            finalQRCode = qrCode;
          } else {
            // Convert SVG to base64 with ASCII handling
            const encoder = new TextEncoder();
            const bytes = encoder.encode(qrCode);
            const base64QR = btoa(String.fromCharCode(...new Uint8Array(bytes)));
            finalQRCode = `data:image/svg+xml;base64,${base64QR}`;
          }
          
          // Store QR code in state and localStorage with user-specific key
          setQR(finalQRCode);
          localStorage.setItem(qrCodeKey, finalQRCode);
          
        } catch (err) {
          console.error('Error processing QR code:', err);
          setError('Failed to generate QR code');
        } finally {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error in MFA enrollment:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
    })()
  }, [])

  return (
    <RoundedCard>
      <CardHeader>
        <CardTitle className="text-center">Set Up Two-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Only show normal errors, not the suppressed ones */}
          {error && !error.includes("friendly name") && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          
          {/* Show a generic helpful message when we get the suppressed error */}
          {error && error.includes("friendly name") && (
            <div className="text-amber-600 text-sm text-center p-2 bg-amber-50 rounded-md border border-amber-100">
              <p className="font-medium">Having trouble?</p>
              <p>Try refreshing the page or opening in a private/incognito window.</p>
            </div>
          )}
          
          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <div className="text-gray-500">Generating QR code...</div>
            ) : qr ? (
              <img 
                src={qr} 
                alt="MFA QR Code" 
                className="mx-auto w-48 h-48"
                onError={(e) => {
                  console.error('Image failed to load:', qr);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="text-gray-500">Failed to generate QR code</div>
            )}
            <div className="text-sm text-gray-600 text-center">
              <p>1. Install Google Authenticator</p>
              <p>2. Scan the QR code within authenticator</p>
              <p>3. Input the 6-digit code from the authenticator app</p>
            </div>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => {
              // Only allow numeric input
              const numericValue = e.target.value.replace(/\D/g, '');
              setVerifyCode(numericValue);
            }}
            placeholder="Enter 6-digit code"
            className="text-center"
          />
          <div className="flex flex-col gap-3">
            <Button onClick={onEnableClicked} className="w-full" disabled={isVerifying}>
              {isVerifying ? "Loading..." : "Enable"}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="w-full" disabled={isVerifying}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </RoundedCard>
  )
}

export function AuthMFA({ 
  onVerificationComplete 
}: { 
  onVerificationComplete: () => void 
}) {
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const navigate = useNavigate();

  const handleCancel = () => {
    // Navigate back instead of signing out
    (async () => {
      try {
        // Reset component state
        setVerifyCode('');
        setError('');
        
        // Navigate back to the previous page or a specific route
        navigate(-1); // Go back to previous page
        
      } catch (error) {
        console.error("Error during MFA verification cancellation:", error);
        navigate(-1); // Still navigate back even if there was an error
      }
    })();
  };

  const onSubmitClicked = () => {
    setError('')
    setIsVerifying(true)
    ;(async () => {
      try {
        console.log("Starting verification process...");
        
        // Get current user ID for user-specific localStorage
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session || !sessionData.session.user) {
          console.error("Session error:", sessionError);
          setError("Authentication required. Please log in again.");
          setIsVerifying(false);
          return;
        }
        
        const userId = sessionData.session.user.id;
        
        const factors = await supabase.auth.mfa.listFactors()
        if (factors.error) {
          console.error("Error getting factors:", factors.error);
          setError(factors.error.message);
          setIsVerifying(false);
          return;
        }

        // Check if we have TOTP factors
        if (!factors.data.totp || factors.data.totp.length === 0) {
          console.error("No TOTP factors found");
          setError("No authenticator factors found");
          setIsVerifying(false);
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
          return;
        }

        const totpFactor = factors.data.totp[0]
        const factorId = totpFactor.id

        console.log("Creating challenge for factor");
        const challenge = await supabase.auth.mfa.challenge({ factorId })
        if (challenge.error) {
          console.error("Error creating challenge:", challenge.error);
          setError(challenge.error.message);
          setIsVerifying(false);
          return;
        }

        const challengeId = challenge.data.id

        console.log("Verifying code");
        const verify = await supabase.auth.mfa.verify({
          factorId,
          challengeId,
          code: verifyCode,
        })
        
        if (verify.error) {
          console.error("Verification error:", verify.error);
          setError(verify.error.message);
          setIsVerifying(false);
          return;
        }

        console.log("Verification successful!");

        // Get session and properly synchronize tokens
        const { data: updatedSessionData, error: updatedSessionError } = await supabase.auth.getSession();
        
        if (updatedSessionError) {
          console.error("Session error:", updatedSessionError);
          setError("Verification successful but session error occurred");
          setIsVerifying(false);
          return;
        }
        
        // Update tokens with the current session to ensure consistency
        if (updatedSessionData.session) {
          console.log("Updating tokens with current session");
          localStorage.setItem("access_token", updatedSessionData.session.access_token);
          localStorage.setItem("refresh_token", updatedSessionData.session.refresh_token);
          
          // Make sure Supabase client uses the updated tokens
          await supabase.auth.setSession({
            access_token: updatedSessionData.session.access_token,
            refresh_token: updatedSessionData.session.refresh_token
          });
        }
        
        // Set a flag in localStorage with user-specific key
        localStorage.setItem(`mfa_verified_${userId}`, "true");
        localStorage.setItem(`mfa_verified_at_${userId}`, new Date().toISOString());
        localStorage.setItem("mfa_verified", "true"); // Keep this for backward compatibility
        localStorage.setItem("mfa_verified_at", new Date().toISOString()); // Keep this for backward compatibility
        
        // Call the completion callback - let React Router handle navigation
        console.log("Calling verification complete callback");
        onVerificationComplete();
        
      } catch (error) {
        console.error("Unexpected error during verification:", error);
        setError("An unexpected error occurred");
        setIsVerifying(false);
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    })()
  }

  return (
    <RoundedCard>
      <CardHeader>
        <CardTitle className="text-center">Two-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {error && !error.includes("friendly name") && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          
          {/* Show a generic helpful message when we get the suppressed error */}
          {error && (error.includes("friendly name")) && (
            <div className="text-amber-600 text-sm text-center p-2 bg-amber-50 rounded-md border border-amber-100">
              <p className="font-medium">Having trouble?</p>
              <p>Try refreshing the page or opening in a private/incognito window.</p>
            </div>
          )}
          <div className="mb-4 text-center">Please enter the code from your authenticator app.</div>
          {/* Only show normal errors, not the suppressed ones */}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => {
              // Only allow numeric input
              const numericValue = e.target.value.replace(/\D/g, '');
              setVerifyCode(numericValue);
            }}
            className="w-full p-2 mb-4 border border-gray-300 rounded text-center"
            placeholder="Enter 6-digit code"
          />
          <div className="flex flex-col gap-3">
            <Button onClick={onSubmitClicked} className="w-full" disabled={isVerifying}>
              {isVerifying ? "Loading..." : "Verify"}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="w-full" disabled={isVerifying}>
              Cancel and Logout
            </Button>
          </div>
        </div>
      </CardContent>
    </RoundedCard>
  )
} 