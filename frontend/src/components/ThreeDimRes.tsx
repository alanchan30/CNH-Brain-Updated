import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useLoader } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"; // Correct path

interface BrainModelProps {
  url: string;
  color?: string;
  opacity?: number;
  scale?: [number, number, number];
}

const BrainModel: React.FC<BrainModelProps> = ({
  url,
  color = "gray",
  opacity = 0.7,
  scale = [0.1, 0.1, 0.1],
}) => {
  const obj = useLoader(OBJLoader, url);
  const ref = useRef<THREE.Object3D>(null); // Explicitly type useRef

  // Center and apply material
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
      });
      child.geometry.center();
    }
  });

  return <primitive object={obj} ref={ref} scale={scale} />;
};

interface ThreeDimResProps {
  width?: number;
  height?: number;
  modelUrl?: string;
  referenceBrainUrl?: string;
}

const ThreeDimRes: React.FC<ThreeDimResProps> = ({
  width = 800,
  height = 600,
  modelUrl = "/brain.obj",
  referenceBrainUrl = "/reference_brain.obj",
}) => {
  return (
    <div style={{ width, height }}>
      <Canvas camera={{ position: [0, 0, 200], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <BrainModel
          url={modelUrl}
          color="gray"
          opacity={0.7}
          scale={[0.1, 0.1, 0.1]}
        />
        <BrainModel
          url={referenceBrainUrl}
          color="blue"
          opacity={0.3}
          scale={[0.1, 0.1, 0.1]}
        />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};

export default ThreeDimRes;
