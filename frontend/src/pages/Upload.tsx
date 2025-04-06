import FileUpload from "@/components/ui/FileUpload";
import Header from "@/components/ui/header";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";

export default function Upload() {
  const navigate = useNavigate();
  const { user, loading, error } = useUser();

  useEffect(() => {
    if (user) {
      // NOTE TO JUDE AND CATHY, THIS LOGS THE USER, USE THE USER ID IN THIS TO LINK THE FMRI HISTORY TO THE USER WHEN TYING UPL THE API ROUT E-- naman
      console.log('Current user:', {
        id: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at,
        metadata: user.user_metadata,
        createdAt: user.created_at
      });
    }
  }, [user]);

  // Show loading state while fetching user data
  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Header showButton redirect={() => navigate("/upload")} page="upload" />
        <div className="flex flex-grow justify-center items-center">
          Loading user data...
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    console.error('User fetch error:', error);
  }

  const handleNext = () => {
    console.log("Next button clicked");
    console.log("Current user:", user); // Log user data when next is clicked
  };

  return (
    <div className="h-screen flex flex-col">
      <Header showButton redirect={() => navigate("/upload")} page="upload" />

      <div className="flex flex-col h-full p-8">
        <div className="flex flex-col space-y-2">
          <h2 className="md:text-5xl text-2xl font-bold">Upload Brain Image</h2>
          {user && (
            <p className="text-sm text-gray-600">
              Logged in as: {user.email}
            </p>
          )}
        </div>

        <div className="flex flex-grow justify-center items-center">
          <FileUpload />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="red-button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
