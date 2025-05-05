import React, { useEffect, useRef } from "react";
import { Niivue } from "@niivue/niivue";
import { create, over } from "lodash";
import { createZScoreColormap } from "@/lib/utils";
import { API_URL } from "./constants";

interface NiftiViewerProps {
  width?: number;
  height?: number;
  niftiUrl?: string;
  referenceNiftiUrl?: string; // Optional reference brain (e.g., MNI152)
  id: string;
}

const ThreeDimRes: React.FC<NiftiViewerProps> = ({
  width = 800,
  height = 600,
  niftiUrl, // Using the file from public directory
  referenceNiftiUrl, // Using the same file as reference
  id,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const niivueRef = useRef<Niivue | null>(null);

  const fetchPrediction = async () => {
    const response = await fetch(`${API_URL}/model-prediction/${id}/`);
    if (!response.ok) {
      throw new Error("Failed to fetch model prediction");
    }
    const data = await response.json();
    const model_result = data.model_result;

    return model_result
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Niivue with proper configuration
    const nv = new Niivue({
      isColorbar: true, // Show colorbar for better visualization
      show3Dcrosshair: true,
      backColor: [0.1, 0.1, 0.1, 1], // Dark background for better contrast
      isRadiologicalConvention: true, // Standard radiological convention
      isSliceMM: true, // Show slice position in mm
      multiplanarForceRender: true, // Force multiplanar rendering
      dragMode: 0, // 0 = rotate, 1 = pan, 2 = slice
      isOrientCube: true, // Show orientation cube
      isRuler: true, // Show ruler
    });

    // Attach to canvas
    nv.attachToCanvas(canvasRef.current);
    niivueRef.current = nv;

    if (!niftiUrl || !referenceNiftiUrl) {
      console.error("No valid file URLs provided to Niivue");
      return;
    }

    const overlayMap = createZScoreColormap();
    nv.addColormap("zscore", overlayMap);

    // Load volumes with proper configuration
    const loadVolumes = async () => {
      try {
        // Add the overlay when classified as autism so we can see the visual difference
        const volumes = [
          {
            url: referenceNiftiUrl,
            colormap: "gray",
            opacity: 0.5,
            cal_min: 0,
            cal_max: 100,
          },
        ];
  
        const prediction = await fetchPrediction();
        if (prediction === 1) {
          volumes.push({
            url: niftiUrl,
            colormap: "zscore",
            opacity: 1.0,
            cal_min: -2.0,
            cal_max: 2.0,
          });
        }
        
        // Load volumes and set up 3D view
        await nv.loadVolumes(volumes);
        
        // Set up 3D rendering mode
        nv.setRenderAzimuthElevation(120, 10);
        nv.setClipPlane([0, 0, 0, 0]);
        nv.setSliceType(nv.sliceTypeRender);
        nv.setInterpolation(false);
        
        // Set initial volume and frame
        if (nv.volumes.length > 0) {
          nv.volumes[0].frame4D = 0;
        }
  
        console.log(nv.volumes);
      } catch (err) {
        console.error("Error loading volumes:", err);
      }
    };
  
    loadVolumes();
  
    // Cleanup on mount
    return () => {
      niivueRef.current = null;
    };
  }, [niftiUrl, referenceNiftiUrl]);

  return (
    <div style={{ width, height }} className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg shadow-lg"
      />
    </div>
  );
};

export default ThreeDimRes;
