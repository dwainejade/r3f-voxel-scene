import { useVoxelStore } from "../store/voxelStore";
import { getMaterialById } from "../core/materials";

export default function VoxelPreview() {
  const previewVoxel = useVoxelStore((state) => state.previewVoxel);
  const currentMaterial = useVoxelStore((state) => state.currentMaterial);
  const assetPreview = useVoxelStore((state) => state.assetPreview);
  const voxelMode = useVoxelStore((state) => state.voxelMode);
  const brushWidth = useVoxelStore((state) => state.brushWidth);
  const brushHeight = useVoxelStore((state) => state.brushHeight);
  const brushDepth = useVoxelStore((state) => state.brushDepth);

  // Hide voxel preview when:
  // - placing assets
  // - in select or remove mode (no preview needed)
  if (!previewVoxel || assetPreview.assetId || voxelMode === 'select' || voxelMode === 'remove') return null;

  const [baseX, baseY, baseZ] = previewVoxel;
  const material = getMaterialById(currentMaterial);

  if (!material) return null;

  // Generate all voxels in the brush area
  const voxels = [];
  for (let dx = 0; dx < brushWidth; dx++) {
    for (let dy = 0; dy < brushHeight; dy++) {
      for (let dz = 0; dz < brushDepth; dz++) {
        voxels.push({
          x: baseX + dx,
          y: baseY + dy,
          z: baseZ + dz,
        });
      }
    }
  }

  return (
    <>
      {voxels.map((voxel, idx) => (
        <mesh key={idx} position={[voxel.x, voxel.y, voxel.z]}>
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
      ))}
    </>
  );
}
