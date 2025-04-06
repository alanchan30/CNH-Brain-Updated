import React, { useEffect, useRef } from 'react';

interface BrainBrowserProps {
  width?: number;
  height?: number;
  modelUrl?: string;
}

declare global {
  interface Window {
    BrainBrowser: any;
    THREE: any;
  }
}

export const ThreeDimRes: React.FC<BrainBrowserProps> = ({
  width = 800,
  height = 600,
  modelUrl = "../../brain.obj",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerInitialized = useRef(false); // Track if viewer is already initialized

  useEffect(() => {
    if (viewerInitialized.current) return; // Prevent duplicate initialization
    viewerInitialized.current = true; // Mark viewer as initialized

    const loadScript = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const initializeViewer = async () => {
      if (!window.THREE) {
        await loadScript("https://brainbrowser.cbrain.mcgill.ca/js/lib/three.r66.min.js");
      }

      if (!window.BrainBrowser) {
        await loadScript("https://brainbrowser.cbrain.mcgill.ca/js/brainbrowser/brainbrowser.surface-viewer.min.js");
      }

      if (!window.BrainBrowser?.config) {
        console.error("BrainBrowser is not fully loaded.");
        return;
      }

      window.BrainBrowser.config.set(
        "worker_dir",
        "https://brainbrowser.cbrain.mcgill.ca/js/brainbrowser/workers/"
      );

      if (containerRef.current) {
        window.BrainBrowser.SurfaceViewer.start(containerRef.current.id, (viewer: any) => {
          viewer.loadModelFromURL(modelUrl, {
            format: "wavefrontobj",
            complete: function () {
              console.log("Model loaded successfully");
              viewer.setClearColor(0xffffff);
              viewer.setCameraPosition(0, 0, 2000);
              viewer.setView(1, 1, 1);
            },
            error: function (msg: string) {
              console.error("Error loading model:", msg);
            },
          });

          viewer.render();
        });
      }
    };

    initializeViewer();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""; // Cleanup on unmount
      }
    };
  }, [modelUrl]); // Depend only on modelUrl

  return <div id="brain-viewer-container" ref={containerRef} style={{ width, height }}></div>;
};

export default ThreeDimRes;