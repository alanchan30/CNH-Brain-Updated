import { useEffect, useState } from 'react';
import { supabase } from '../../../backend/auth/supabaseClient';
import { AuthMFA, EnrollMFA } from '../components/MFA';
import Dashboard from './Dashboard';

const MFACheck = () => {
  const [readyToShow, setReadyToShow] = useState(true); // Always true as per requirement
  const [isMFARegistered, setIsMFARegistered] = useState(false);
  const [isMFAVerified, setIsMFAVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        console.error('Error checking MFA status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMFAStatus();
  }, []);

  const handleMFAEnrolled = () => {
    setIsMFARegistered(true);
  };

  const handleMFAVerified = () => {
    setIsMFAVerified(true);
  };

  if (isLoading) {
    return <div>Checking authentication status...</div>;
  }

  if (readyToShow) {
    if (isMFAVerified) {
      return <Dashboard />;
    }
    
    if (isMFARegistered) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="p-6 bg-white rounded shadow-md w-96">
            <h2 className="text-xl font-bold mb-4">Two-Factor Authentication</h2>
            <AuthMFA onVerified={handleMFAVerified} />
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 bg-white rounded shadow-md w-96">
          <h2 className="text-xl font-bold mb-4">Set Up Two-Factor Authentication</h2>
          <p className="mb-4">For security purposes, you need to set up two-factor authentication.</p>
          <EnrollMFA 
            onEnrolled={handleMFAEnrolled} 
            onCancelled={() => alert("MFA setup is required to use the application")} 
          />
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default MFACheck; 