import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { useVoxelStore } from "../store/voxelStore";
import ChunkRenderer from "./ChunkRenderer";
import VoxelEditor from "./VoxelEditor";
import PlaneGuide from "./PlaneGuide";
import VoxelPreview from "./VoxelPreview";

function OrbitControlsWrapper() {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" && controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift" && controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return <OrbitControls ref={controlsRef} />;
}

export default function VoxelCanvas() {
  const scene = useVoxelStore((state) => state.scene);
  // const sceneVersion = useVoxelStore((state) => state.sceneVersion);
  // const gridSize = useVoxelStore((state) => state.gridSize);
  // Create a stable array of chunks that updates when sceneVersion changes
  const chunks = Array.from(scene.chunks.values());

  return (
    <Canvas
      camera={{
        position: [60, 60, 60],
        zoom: 30,
        near: 0.1,
        far: 1000,
      }}
      dpr={[1, 2]}
      orthographic
      shadows
      style={{
        height: "100vh",
        width: "100vw",
        background:
          "linear-gradient(to bottom, #87ceeb 10%, #cae9f5ff 40%, #ffffff 100%)",
      }}
    >
      <Stats />
      <ambientLight intensity={2} />
      {/* <directionalLight
        position={[30, 40, 30]}
        intensity={0.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      /> */}
      <hemisphereLight args={[0xf0e6d2, 0xd4c5b0, 0.8]} />

      {chunks.map((chunk) => (
        <ChunkRenderer key={`${chunk.x},${chunk.y},${chunk.z}`} chunk={chunk} />
      ))}

      <VoxelPreview />

      <OrbitControlsWrapper />
      {/* <gridHelper args={[gridSize, gridSize]} /> */}
      <axesHelper args={[20]} />
      <PlaneGuide />

      <VoxelEditor />
    </Canvas>
  );
}
