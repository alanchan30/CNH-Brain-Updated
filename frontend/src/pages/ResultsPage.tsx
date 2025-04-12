import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useEffect, useState } from "react";
import Header from "../components/ui/header";
import { ThreeDimRes } from "@/components/ThreeDimRes";
import { API_URL } from "@/components/constants";
import { useParams } from "react-router-dom";
import Plot from "react-plotly.js";
import { ClipLoader } from "react-spinners";

interface AtlasViews {
  axial: number[][];
  coronal: number[][];
  sagittal: number[][];
}

interface BrainViews {
  axial: number[][];
  coronal: number[][];
  sagittal: number[][];
}

interface BrainData {
  brain: BrainViews;
  atlas: AtlasViews;
  labels: string[];
}

interface CacheItem {
  data: BrainData;
  timestamp: number;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const SLICE_BATCH_SIZE = 5; // Number of slices to fetch at once

const ResultsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [brainData, setBrainData] = useState<BrainData | null>(null);
  const [sliceIndex, setSliceIndex] = useState<number>(94);
  const [displaySliceIndex, setDisplaySliceIndex] = useState<number>(94);
  const [maxSliceIndex, setMaxSliceIndex] = useState<number>(100);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const { id } = useParams();

  const fetchBrainData = async (index: number) => {
    const response = await fetch(`${API_URL}/2d-fmri-data/${id}/${index}`);
    if (!response.ok) {
      throw new Error("Failed to fetch brain data");
    }
    const data = await response.json();
    setBrainData(data);
    setDataLoading(false);
    setMaxSliceIndex(data.max_index);
  };

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

  useEffect(() => {
    fetchBrainData(sliceIndex);
  }, [id, sliceIndex]);

  const transpose = (matrix: number[][]): number[][] => {
    if (!matrix || matrix.length === 0) return [];
    return matrix[0].map((_, i) => matrix.map((row) => row[i]));
  };

  // Helper function to create custom data array for hover information
  const createCustomData = (
    atlasSlice: number[][],
    labels: string[]
  ): string[][] => {
    if (!atlasSlice || !labels) return [];
    return atlasSlice.map((row) =>
      row.map((regionIndex) =>
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
          <div className="my-6 px-4">
            <label
              htmlFor="slice-slider"
              className="block text-lg font-semibold text-gray-800 mb-3"
            >
              Slice Index:{" "}
              <span className="text-blue-600 font-bold">
                {displaySliceIndex}
              </span>
            </label>

            <div className="relative w-full">
              <input
                type="range"
                id="slice-slider"
                min={0}
                max={maxSliceIndex}
                value={displaySliceIndex}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer transition-all focus:outline-none"
                onChange={(e) => setDisplaySliceIndex(Number(e.target.value))}
                onMouseUp={() => setSliceIndex(displaySliceIndex)}
                onTouchEnd={() => setSliceIndex(displaySliceIndex)}
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                    (displaySliceIndex / maxSliceIndex) * 100
                  }%, #E5E7EB ${
                    (displaySliceIndex / maxSliceIndex) * 100
                  }%, #E5E7EB 100%)`,
                }}
              />
              <div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600"
                style={{
                  left: `${(displaySliceIndex / maxSliceIndex) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {displaySliceIndex}
              </div>
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
            ) : brainData ? (
              <>
                {/* Axial View */}
                <div className="border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <Plot
                    data={[
                      {
                        z: transpose(brainData.brain.axial),
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        showscale: false,
                        customdata: createCustomData(
                          transpose(brainData.atlas.axial),
                          brainData.labels
                        ),
                        hovertemplate: "Region: %{customdata}<extra></extra>",
                      },
                      {
                        z: transpose(brainData.atlas.axial),
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

                {/* Coronal View */}
                <div className="border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <Plot
                    data={[
                      {
                        z: transpose(brainData.brain.coronal),
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        showscale: false,
                        customdata: createCustomData(
                          transpose(brainData.atlas.coronal),
                          brainData.labels
                        ),
                        hovertemplate: "Region: %{customdata}<extra></extra>",
                      },
                      {
                        z: transpose(brainData.atlas.coronal),
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

                {/* Sagittal View */}
                <div className="border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <Plot
                    data={[
                      {
                        z: transpose(brainData.brain.sagittal),
                        type: "heatmap",
                        colorscale: "Viridis",
                        zsmooth: "best",
                        showscale: false,
                        customdata: createCustomData(
                          transpose(brainData.atlas.sagittal),
                          brainData.labels
                        ),
                        hovertemplate: "Region: %{customdata}<extra></extra>",
                      },
                      {
                        z: transpose(brainData.atlas.sagittal),
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
                  onClick={() => fetchBrainData(sliceIndex)}
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
            <ThreeDimRes
              width={600}
              height={600}
              // modelUrl={`${API_URL}/models/brain.obj`} // Update this URL to point to your actual brain model
            />
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
