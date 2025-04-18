import React, { useEffect, useRef } from "react";
import { Niivue } from "@niivue/niivue";
// import brainFile from "../assets/MNI152_T1_1mm_brain.nii";

interface NiftiViewerProps {
  width?: number;
  height?: number;
  niftiUrl?: string;
  referenceNiftiUrl?: string; // Optional reference brain (e.g., MNI152)
}

const ThreeDimRes: React.FC<NiftiViewerProps> = ({
  width = 800,
  height = 600,
  niftiUrl, // Using the file from public directory
  referenceNiftiUrl, // Using the same file as reference
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const niivueRef = useRef<Niivue | null>(null);

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

    // Load volumes with proper configuration
    const volumes = [
      {
        url: referenceNiftiUrl,
        colormap: "gray", // Grayscale for reference brain
        opacity: 0.5, // Semi-transparent
        cal_min: 0, // Minimum intensity
        cal_max: 100, // Maximum intensity
      },
      {
        url: niftiUrl,
        colormap: "red", // Highlight your scan in red
        opacity: 0.8,
        cal_min: 0,
        cal_max: 100,
      },
    ];

    // Load volumes and set up 3D view
    nv.loadVolumes(volumes).then(() => {
      // Set to 3D rendering mode
      nv.setRenderAzimuthElevation(120, 10); // Adjust view angle
      nv.setClipPlane([0, 0, 0, 0]); // Disable clipping for full 3D view
      nv.setSliceType(nv.sliceTypeRender); // Set to 3D rendering mode

      // Set initial volume and frame
      if (nv.volumes.length > 0) {
        nv.volumes[0].frame4D = 0;
      }

      // Force a redraw
      nv.updateGLVolume();
    });

    // Cleanup on unmount
    return () => {
      if (niivueRef.current) {
        niivueRef.current = null;
      }
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
