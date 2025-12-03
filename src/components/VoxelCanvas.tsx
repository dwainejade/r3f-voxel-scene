import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats, Environment } from "@react-three/drei";
import { useVoxelStore } from "../store/voxelStore";
import ChunkRenderer from "./ChunkRenderer";
import VoxelEditor from "./VoxelEditor";
import PlaneGuide from "./PlaneGuide";
import VoxelPreview from "./VoxelPreview";
import LightRenderer from "./LightRenderer";
import AssetPreview from "./AssetPreview";
import AssetGeometryPreview from "./AssetGeometryPreview";
import VoxelSelectionHighlight from "./VoxelSelectionHighlight";
import VoxelHoverHighlight from "./VoxelHoverHighlight";

function OrbitControlsWrapper() {
  const controlsRef = useRef<any>(null);
  const confirmAssetPreview = useVoxelStore((state) => state.confirmAssetPreview);
  const cancelAssetPreview = useVoxelStore((state) => state.cancelAssetPreview);
  const rotateAssetPreview = useVoxelStore((state) => state.rotateAssetPreview);
  const adjustAssetHeight = useVoxelStore((state) => state.adjustAssetHeight);
  const assetPreview = useVoxelStore((state) => state.assetPreview);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" && controlsRef.current) {
        controlsRef.current.enabled = false;
      }

      // Asset placement shortcuts
      if (assetPreview.assetId) {
        if (e.key === "Enter" && assetPreview.canPlace) {
          confirmAssetPreview();
        } else if (e.key === "Escape") {
          cancelAssetPreview();
        } else if (e.key === "q" || e.key === "Q") {
          rotateAssetPreview(-1);
        } else if (e.key === "e" || e.key === "E") {
          rotateAssetPreview(1);
        } else if (e.key === "ArrowUp") {
          adjustAssetHeight(1);
          e.preventDefault();
        } else if (e.key === "ArrowDown") {
          adjustAssetHeight(-1);
          e.preventDefault();
        }
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
  }, [assetPreview.assetId, assetPreview.canPlace, confirmAssetPreview, cancelAssetPreview, rotateAssetPreview, adjustAssetHeight]);

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
      <Environment preset="apartment" />
      {/* <ambientLight intensity={0.4} /> */}
      <directionalLight
        position={[30, 40, 30]}
        intensity={0.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      {chunks.map((chunk) => (
        <ChunkRenderer key={`${chunk.x},${chunk.y},${chunk.z}`} chunk={chunk} />
      ))}

      <VoxelPreview />
      <AssetPreview />
      <AssetGeometryPreview />
      <VoxelSelectionHighlight />
      <VoxelHoverHighlight />
      <LightRenderer />

      <OrbitControlsWrapper />
      {/* <gridHelper args={[gridSize, gridSize]} /> */}
      <axesHelper args={[20]} />
      <PlaneGuide />

      <VoxelEditor />
    </Canvas>
  );
}
