import Header from "@/components/ui/header";
import History from "@/components/ui/history";
import React from "react";
import { useNavigate } from "react-router-dom";

const HistoryPage = () => {
  const navigate = useNavigate();

  return(
    <div className="h-screen flex flex-col">
      <Header page="history" showButton redirect={() => navigate('/landing')} />
      <History />
    </div>

  )
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">Work in Progress</h1>
        <p className="mt-4 text-lg text-gray-600">
          We're currently working on this page. Please check back later!
        </p>
        <div className="mt-6">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={() => navigate("/landing")}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
