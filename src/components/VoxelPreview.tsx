import { useVoxelStore } from "../store/voxelStore";

export default function VoxelPreview() {
  const previewVoxel = useVoxelStore((state) => state.previewVoxel);
  const currentMaterial = useVoxelStore((state) => state.currentMaterial);

  if (!previewVoxel) return null;

  const [x, y, z] = previewVoxel;

  // Material colors (must match those in ChunkRenderer)
  const materialColors = [
    0xff6b6b, // Red
    0x51cf66, // Green
    0x4dabf7, // Blue
    0xffd43b, // Yellow
    0xda77f2, // Purple
  ];

  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={materialColors[currentMaterial]}
        transparent
        opacity={0.5}
        wireframe={false}
        emissive={materialColors[currentMaterial]}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}
