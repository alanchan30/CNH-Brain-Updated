import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useEffect, useState } from "react";
import Header from "../components/ui/header";
import { Slider } from "@/components/ui/slider";
import { ThreeDimRes } from "@/components/ThreeDimRes";
import { TwoDimRes } from "@/components/TwoDimRes";
import { API_URL } from "@/components/constants";
import { SideViewRes } from "@/components/SideViewRes";
import { useParams } from "react-router-dom";
import Plot from "react-plotly.js";
import { ClipLoader } from "react-spinners";

const ResultsPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [twoDResults, setTwoDResults] = useState<any>(null);
  const [sliceIndex, setSliceIndex] = useState<number>(33);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const { id } = useParams(); // Get the ID from the URL

  useEffect(() => {
    if (!id) {
      navigate("/404");
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetch2dResults = async () => {
    try {
      setDataLoading(true);
      const response = await fetch(`${API_URL}/2d-fmri-data/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch brain data");
      }
      const data = await response.json();
      setTwoDResults(data);
    } catch (error) {
      console.error("Error fetching 2D results:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetch2dResults();
  }, [id]);

  const handleSliderChange = (values: number[]) => {
    setSliceIndex(values[0]);
    // In a full implementation, you would fetch a new slice at this index
    // or calculate it from 3D data
  };

  // Function to create hover text based on atlas data and labels
  const createHoverTemplate = (x: number, y: number, z: number) => {
    if (!twoDResults || !twoDResults.atlas || !twoDResults.labels) {
      return "No region data available";
    }

    try {
      const regionIndex = twoDResults.atlas[y][x];
      if (regionIndex >= 0 && regionIndex < twoDResults.labels.length) {
        return `Region: ${twoDResults.labels[regionIndex]}`;
      }
      return "No specific region";
    } catch (error) {
      return "Region data unavailable";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header
        redirect={() => navigate("/landing")}
        showButton={true}
        page="results"
      />
      <div className="p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-start text-4xl font-bold text-gray-800">
            Model Results
          </h1>
          <p className="text-gray-600 mt-2">
            Analysis results for scan ID: {id}
          </p>
        </div>

        {/* 2D Model Section */}
        <div className="w-full bg-blue-600 rounded-t-lg p-3 shadow-md">
          <h1 className="text-white text-center text-3xl font-bold">
            2D Brain Analysis
          </h1>
        </div>

        <div className="bg-white rounded-b-lg shadow-md p-4 mb-8">
          {/* For the brain image */}
          <div className="flex flex-col items-center justify-center mb-6">
            <TwoDimRes />

            {/* Slider component with proper labeling */}
            <div className="w-full max-w-2xl mt-4">
              <p className="text-gray-700 mb-2 font-medium">
                Slice Index: {sliceIndex}
              </p>
              <Slider
                defaultValue={[sliceIndex]}
                value={[sliceIndex]}
                max={100}
                step={1}
                onValueChange={handleSliderChange}
              />
            </div>
          </div>

          {/* Brain view cards */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {dataLoading ? (
              <div className="flex flex-col items-center justify-center w-full py-16">
                <ClipLoader color="#3B82F6" size={60} />
                <p className="text-blue-600 mt-4 font-medium text-lg">
                  Loading brain slices...
                </p>
              </div>
            ) : twoDResults ? (
              <>
                <div className="border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <Plot
                    data={[
                      {
                        z: twoDResults.brain.axial,
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        hovertemplate:
                          "X: %{x}<br>" +
                          "Y: %{y}<br>" +
                          "%{customdata}<extra></extra>",
                      },
                      {
                        z: twoDResults.atlas,
                        type: "contour",
                        line: { color: "white", width: 1 },
                        showscale: false,
                        hoverinfo: "skip",
                      },
                    ]}
                    layout={{
                      title: "Axial View",
                      width: 320,
                      height: 320,
                      paper_bgcolor: "#111",
                      plot_bgcolor: "#111",
                      font: { color: "white" },
                      margin: { l: 10, r: 10, t: 40, b: 10 },
                      hovermode: "closest",
                    }}
                    config={{
                      displayModeBar: false,
                      responsive: true,
                    }}
                  />
                  <h2 className="text-center text-xl font-semibold bg-gray-100 p-2">
                    Axial View
                  </h2>
                </div>

                <div className="border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <Plot
                    data={[
                      {
                        z: twoDResults.brain.coronal,
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        hovertemplate:
                          "X: %{x}<br>" +
                          "Y: %{y}<br>" +
                          "Value: %{z:.2f}<extra></extra>",
                      },
                    ]}
                    layout={{
                      title: "Coronal View",
                      width: 320,
                      height: 320,
                      paper_bgcolor: "#111",
                      plot_bgcolor: "#111",
                      font: { color: "white" },
                      margin: { l: 10, r: 10, t: 40, b: 10 },
                      hovermode: "closest",
                    }}
                    config={{
                      displayModeBar: false,
                      responsive: true,
                    }}
                  />
                  <h2 className="text-center text-xl font-semibold bg-gray-100 p-2">
                    Coronal View
                  </h2>
                </div>

                <div className="border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <Plot
                    data={[
                      {
                        z: twoDResults.brain.sagittal,
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        hovertemplate:
                          "X: %{x}<br>" +
                          "Y: %{y}<br>" +
                          "Value: %{z:.2f}<extra></extra>",
                      },
                    ]}
                    layout={{
                      title: "Sagittal View",
                      width: 320,
                      height: 320,
                      paper_bgcolor: "#111",
                      plot_bgcolor: "#111",
                      font: { color: "white" },
                      margin: { l: 10, r: 10, t: 40, b: 10 },
                      hovermode: "closest",
                    }}
                    config={{
                      displayModeBar: false,
                      responsive: true,
                    }}
                  />
                  <h2 className="text-center text-xl font-semibold bg-gray-100 p-2">
                    Sagittal View
                  </h2>
                </div>
              </>
            ) : (
              <div className="text-center p-8 w-full">
                <p className="text-red-500">
                  Failed to load brain data. Please try again later.
                </p>
                <button
                  onClick={fetch2dResults}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3D Model Section */}
        <div className="w-full bg-blue-600 rounded-t-lg p-3 shadow-md">
          <h1 className="text-white text-center text-3xl font-bold">
            3D Model Visualization
          </h1>
        </div>
        <div className="bg-white rounded-b-lg shadow-md p-4 mb-8">
          <div className="flex flex-col items-center justify-center">
            <ThreeDimRes />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 mb-6">
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition duration-200 flex items-center justify-center"
            onClick={() => {
              /* Handle anomaly results view */
              console.log("View anomaly results");
            }}
          >
            View Anomaly Results
          </button>

          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition duration-200 flex items-center justify-center"
            onClick={() => {
              /* Handle download/export */
              console.log("Download results");
            }}
          >
            Export Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
