import { useAuth } from "../context/auth-context";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HistoryIcon from "../assets/History.svg";
import UploadIcon from "../assets/Upload.svg";
import Header from "../components/ui/header";

const LandingPage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const handleUploadClick = () => {
    navigate("/upload");
  };

  const handleHistoryClick = () => {
    navigate("/history");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header
        redirect={() => navigate("/landing")}
        showButton={true}
        page="landing"
      />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-grow text-center p-6">
        <div className="text-2xl md:text-4xl font-bold">
          Hello, {user?.email?.split("@")[0] || "User"}!
        </div>
        <p className="text-black-600 mt-2">
          Upload a file to initiate a new brain scan or access history for
          previous scans.
        </p>

        {/* Buttons Section */}
        <div className="flex gap-8 mt-8">
          {/* Upload Button */}
          <div
            className="bg-white shadow-lg p-6 rounded-lg flex flex-col items-center cursor-pointer hover:shadow-xl transition-shadow"
            onClick={handleUploadClick}
          >
            <img src={UploadIcon} alt="Upload Icon" className="w-12 h-12" />
            <h2 className="text-lg font-semibold mt-2">
              Initiate New Brain Scan
            </h2>
            <button className="bg-red-500 hover:bg-red-600 transition-colors text-white px-6 py-3 rounded mt-4 flex items-center justify-center">
              Upload
            </button>
          </div>

          {/* History Button */}
          <div
            className="bg-white shadow-lg p-6 rounded-lg flex flex-col items-center cursor-pointer hover:shadow-xl transition-shadow"
            onClick={handleHistoryClick}
          >
            <img src={HistoryIcon} alt="History Icon" className="w-12 h-12" />
            <h2 className="text-lg font-semibold mt-2">
              Access Previous Brain Scan
            </h2>
            <button className="bg-red-500 hover:bg-red-600 transition-colors text-white px-6 py-3 rounded mt-4 flex items-center justify-center">
              History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
