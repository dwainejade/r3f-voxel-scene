import { useVoxelStore } from "../store/voxelStore";
import { getMaterialById } from "../core/materials";

export default function VoxelPreview() {
  const previewVoxel = useVoxelStore((state) => state.previewVoxel);
  const currentMaterial = useVoxelStore((state) => state.currentMaterial);
  const assetPreview = useVoxelStore((state) => state.assetPreview);

  // Hide voxel preview when placing assets
  if (!previewVoxel || assetPreview.assetId) return null;

  const [x, y, z] = previewVoxel;
  const material = getMaterialById(currentMaterial);

  if (!material) return null;

  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={material.color}
        transparent
        opacity={0.6}
        wireframe={false}
        emissive={material.emissive || material.color}
        emissiveIntensity={material.emissiveIntensity ? material.emissiveIntensity * 0.5 : 0.2}
        roughness={material.roughness}
        metalness={material.metalness}
      />
    </mesh>
  );
}
