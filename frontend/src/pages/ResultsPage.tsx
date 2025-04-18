import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useEffect, useState } from "react";
import Header from "../components/ui/header";
import { API_URL } from "@/components/constants";
import { useParams } from "react-router-dom";
import Plot from "react-plotly.js";
import { ClipLoader } from "react-spinners";
import ThreeDimRes from "@/components/ThreeDimRes";

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
  const [prediction, setPrediction] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [brainData, setBrainData] = useState<BrainData | null>(null);
  const [sliceIndex, setSliceIndex] = useState<number>(94);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [displaySliceIndex, setDisplaySliceIndex] = useState<number>(94);
  const [maxSliceIndex, setMaxSliceIndex] = useState<number>(100);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const { id } = useParams();

  const deleteNiftiTemp = async() => {
    try {
      const res = await fetch(`${API_URL}/delete-temp-files/`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete temporary file");

      console.log("Temp files deleted");
    } catch (err) {
      console.error("Failed to delete file before redirecting:", err);
    }
  }

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


  const fetchPrediction = async() => {
    const response = await fetch(`${API_URL}/model-prediction/${id}/`);
    if (!response.ok) {
      throw new Error("Failed to fetch model prediction");
    }
    const data = await response.json();
    const model_result = data.model_result;

    if (model_result === 1) {
      setPrediction("Probable to be Austistic")
    } else if (model_result === 0) {
      setPrediction("Probable to be Neurotypical")
    }
  }

  const fetch3DBrainData = async () => {
    const response = await fetch(`${API_URL}/3d-fmri-file/${id}/`);

    if (!response.ok) {
      throw new Error("Failed to fetch brain data");
    }
    const data = await response.json();

    setFileUrl(`${API_URL}${data.url}`);
    setFileName(data.filename)
  };


  useEffect(() => {
    if (!id) {
      if (fileName) {
        deleteNiftiTemp()
      }
      navigate("/404");
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      if (fileName) {
        deleteNiftiTemp()
      }
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    fetch3DBrainData()
  }, [id])

  useEffect(() => {
    fetchBrainData(sliceIndex);
  }, [id, sliceIndex]);

  useEffect(() => {
    fetchPrediction()
    console.log(prediction)
  }, [id])

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
        redirect={() => ("/landing")}
        showButton={true}
        page="results"
        fileName={fileName}
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
            {/* <ThreeDimRes
              width={600}
              height={600}
              // modelUrl={`${API_URL}/models/brain.obj`} // Update this URL to point to your actual brain model
            /> */}

            <ThreeDimRes
              width={600}
              height={600}
              niftiUrl={fileUrl}
              referenceNiftiUrl={fileUrl}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 mb-6">
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition duration-200 flex items-center justify-center"
            onClick={() => setShowModal(true)}
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
        {prediction && showModal && (
          <>
            <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>

            </div>
            
            {/* Content of the modal, positioned on top of the backdrop layer */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden pointer-events-auto">
                {/* Modal Header */}
                <div className="w-full bg-blue-600 p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-white text-2xl font-bold">Anomaly Detection Results</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-white hover:text-gray-200 focus:outline-none"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
        
                {/* Modal Body */}
                <div className="p-6">
                  {/* Prediction Result */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Prediction Result</h3>
                    <div className={`p-5 rounded-lg text-center ${
                      prediction.includes("Autism") 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-xl font-bold ${
                        prediction.includes("Autism") 
                          ? 'text-red-700' 
                          : 'text-green-700'
                      }`}>
                        {prediction}
                      </p>
                    </div>
                  </div>
        
                  {/* Medical Disclaimer */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Disclaimer
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            This analysis is provided for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Model results may not always be accurate or complete. Please consult with a qualified healthcare professional for proper evaluation and diagnosis.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
        
                  {/* Additional Information */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Next Steps</h3>
                    <p className="text-blue-700">
                      For optimal diagnosis, we recommend discussing these results with a qualified healthcare professional who can provide a comprehensive evaluation.
                    </p>
                  </div>
                </div>
        
                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded transition duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
