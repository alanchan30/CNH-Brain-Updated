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

interface BrainViews {
  axial: number[][];
  coronal: number[][];
  sagittal: number[][];
}

interface BrainData {
  brain: BrainViews;
  atlas: number[][];
  labels: string[];
}

const ResultsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [brainData, setBrainData] = useState<BrainData | null>(null);
  const [sliceIndex, setSliceIndex] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const { id } = useParams();

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

  const fetchBrainData = async () => {
    try {
      setDataLoading(true);
      const response = await fetch(`${API_URL}/2d-fmri-data/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch brain data");
      }
      const data: BrainData = await response.json();
      setBrainData(data);

      // Set slice index to middle of the brain data
      if (data.brain && data.brain.axial) {
        setSliceIndex(Math.floor(data.brain.axial.length / 2));
      }
    } catch (error) {
      console.error("Error fetching brain data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchBrainData();
  }, [id]);

  const handleSliderChange = (values: number[]) => {
    setSliceIndex(values[0]);
  };

  // Function to create hover text based on atlas data and labels
  const createHoverTemplate = (atlas: number[][], labels: string[]) => {
    return (x: number, y: number): string => {
      if (!atlas || !labels) {
        return "No region data available";
      }

      try {
        if (y < 0 || y >= atlas.length || x < 0 || x >= atlas[y].length) {
          return "Outside brain region";
        }

        const regionIndex = atlas[y][x];
        if (regionIndex > 0 && regionIndex < labels.length) {
          return `Region: ${labels[regionIndex]}`;
        }
        return "No specific region";
      } catch (error) {
        return "Region data unavailable";
      }
    };
  };

  // Create custom data for hover info
  const createCustomData = (
    atlas: number[][],
    labels: string[]
  ): string[][] => {
    if (!atlas || !labels)
      return Array(atlas?.length || 0).fill(
        Array(atlas?.[0]?.length || 0).fill("No data")
      );

    return atlas.map((row: number[]) =>
      row.map((regionIndex: number) =>
        regionIndex > 0 && regionIndex < labels.length
          ? labels[regionIndex]
          : "No specific region"
      )
    );
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
          {/* Slider component with proper labeling */}
          <div className="w-full max-w-2xl mx-auto mb-6">
            <p className="text-gray-700 mb-2 font-medium">
              Slice Index: {sliceIndex || "-"}
            </p>
            <Slider
              value={sliceIndex ? [sliceIndex] : [50]}
              max={100}
              step={1}
              onValueChange={handleSliderChange}
            />
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
            ) : brainData ? (
              <>
                <div className="border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <Plot
                    data={[
                      {
                        z: brainData.brain.axial,
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        showscale: false,
                        customdata:
                          brainData.atlas && brainData.labels
                            ? createCustomData(
                                brainData.atlas,
                                brainData.labels
                              )
                            : undefined,
                        hovertemplate: "Region: %{customdata}<extra></extra>",
                        hoverinfo: "z",
                        hoverlabel: { bgcolor: "#333" },
                      },
                      {
                        z: brainData.atlas,
                        type: "contour",
                        contours: {
                          coloring: "none",
                          showlines: true,
                          start: 1,
                          end: brainData.labels ? brainData.labels.length : 10,
                          size: 1,
                        },
                        line: { color: "white", width: 1 },
                        showscale: false,
                        hoverinfo: "skip",
                      },
                    ]}
                    layout={{
                      title: "Axial View",
                      width: 320,
                      height: 320,
                      paper_bgcolor: "black",
                      plot_bgcolor: "black",
                      font: { color: "white" },
                      margin: { l: 10, r: 10, t: 40, b: 10 },
                      hovermode: "closest",
                      xaxis: { showgrid: false, zeroline: false },
                      yaxis: { showgrid: false, zeroline: false },
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
                        z: brainData.brain.coronal,
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        showscale: false,
                        hoverinfo: "z",
                        hovertemplate:
                          "X: %{x}<br>Y: %{y}<br>Value: %{z:.2f}<extra></extra>",
                        hoverlabel: { bgcolor: "#333" },
                      },
                    ]}
                    layout={{
                      title: "Coronal View",
                      width: 320,
                      height: 320,
                      paper_bgcolor: "black",
                      plot_bgcolor: "black",
                      font: { color: "white" },
                      margin: { l: 10, r: 10, t: 40, b: 10 },
                      hovermode: "closest",
                      xaxis: { showgrid: false, zeroline: false },
                      yaxis: { showgrid: false, zeroline: false },
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
                        z: brainData.brain.sagittal,
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        showscale: false,
                        hoverinfo: "z",
                        hovertemplate:
                          "X: %{x}<br>Y: %{y}<br>Value: %{z:.2f}<extra></extra>",
                        hoverlabel: { bgcolor: "#333" },
                      },
                    ]}
                    layout={{
                      title: "Sagittal View",
                      width: 320,
                      height: 320,
                      paper_bgcolor: "black",
                      plot_bgcolor: "black",
                      font: { color: "white" },
                      margin: { l: 10, r: 10, t: 40, b: 10 },
                      hovermode: "closest",
                      xaxis: { showgrid: false, zeroline: false },
                      yaxis: { showgrid: false, zeroline: false },
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
                  onClick={fetchBrainData}
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
