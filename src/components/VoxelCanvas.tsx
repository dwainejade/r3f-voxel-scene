import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats, Sky } from "@react-three/drei";
import { useVoxelStore } from "../store/voxelStore";
import ChunkRenderer from "./ChunkRenderer";
import VoxelEditor from "./VoxelEditor";
import PlaneGuide from "./PlaneGuide";
import VoxelPreview from "./VoxelPreview";

export default function VoxelCanvas() {
  const scene = useVoxelStore((state) => state.scene);
  // const sceneVersion = useVoxelStore((state) => state.sceneVersion);
  const gridSize = useVoxelStore((state) => state.gridSize);
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
    >
      <Stats />
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {chunks.map((chunk) => (
        <ChunkRenderer key={`${chunk.x},${chunk.y},${chunk.z}`} chunk={chunk} />
      ))}

      <VoxelPreview />

      <OrbitControls />
      <gridHelper args={[gridSize, gridSize]} />
      <axesHelper args={[20]} />
      <PlaneGuide />

      <VoxelEditor />
    </Canvas>
  );
}
