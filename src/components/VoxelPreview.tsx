import { useVoxelStore } from "../store/voxelStore";
import { getMaterialById } from "../core/materials";

export default function VoxelPreview() {
  const previewVoxel = useVoxelStore((state) => state.previewVoxel);
  const currentMaterial = useVoxelStore((state) => state.currentMaterial);
  const assetPreview = useVoxelStore((state) => state.assetPreview);
  const voxelMode = useVoxelStore((state) => state.voxelMode);

  // Hide voxel preview when:
  // - placing assets
  // - in select or remove mode (no preview needed)
  if (!previewVoxel || assetPreview.assetId || voxelMode === 'select' || voxelMode === 'remove') return null;

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
