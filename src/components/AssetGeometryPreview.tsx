import { useVoxelStore } from '../store/voxelStore';
import { getMaterialById } from '../core/materials';
import { useCallback, useMemo } from 'react';

export default function AssetGeometryPreview() {
  const assetPreview = useVoxelStore((state) => state.assetPreview);
  const assetLibrary = useVoxelStore((state) => state.assetLibrary);

  const asset = useMemo(
    () => (assetPreview.assetId ? assetLibrary.assets.get(assetPreview.assetId) : null),
    [assetPreview.assetId, assetLibrary]
  );

  // Collect voxels by simulating the asset builder
  const assetVoxels = useMemo(() => {
    if (!asset) return [];

    const voxels: Array<{ x: number; y: number; z: number; materialId: string }> = [];
    const baseX = assetPreview.position[0];
    const baseY = assetPreview.position[1];
    const baseZ = assetPreview.position[2];

    // Simple capture API to collect voxels from builder
    const captureAPI = {
      setVoxel: (x: number, y: number, z: number, materialId: string) => {
        voxels.push({ x: baseX + x, y: baseY + y, z: baseZ + z, materialId });
      },
    };

    // Call the builder to get all voxels
    try {
      asset.builder(captureAPI, 0, 0, 0);
    } catch (e) {
      console.error('Error building asset preview:', e);
    }

    return voxels;
  }, [asset, assetPreview.position]);

  if (!asset || assetVoxels.length === 0) return null;

  return (
    <group>
      {assetVoxels.map((voxel, idx) => {
        const material = getMaterialById(voxel.materialId);
        if (!material) return null;

        return (
          <mesh key={idx} position={[voxel.x, voxel.y, voxel.z]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={material.color}
              transparent
              opacity={0.7}
              wireframe={false}
              emissive={material.emissive || material.color}
              emissiveIntensity={material.emissiveIntensity ? material.emissiveIntensity * 0.3 : 0.15}
              roughness={material.roughness}
              metalness={material.metalness}
            />
          </mesh>
        );
      })}
    </group>
  );
}
