import { useMemo } from 'react';
import { useVoxelStore } from '../store/voxelStore';
import { MATERIAL_PRESETS } from '../core/materials';
import { rotateVoxels } from '../core/rotationUtils';

/**
 * Renders the actual voxels of the asset being previewed
 * This shows what the asset will look like before placement
 */
export default function AssetPreviewVoxels() {
  const assetPreview = useVoxelStore((state) => state.assetPreview);
  const assetLibrary = useVoxelStore((state) => state.assetLibrary);

  const asset = assetPreview.assetId ? assetLibrary.assets.get(assetPreview.assetId) : null;

  // Capture voxels from the asset builder
  const capturedVoxels = useMemo(() => {
    if (!asset) return [];

    const voxels: Array<[number, number, number, string]> = [];
    const captureAPI = {
      setVoxel: (ox: number, oy: number, oz: number, materialId: string) => {
        voxels.push([ox, oy, oz, materialId]);
      },
    };

    asset.builder(captureAPI, 0, 0, 0);
    return voxels;
  }, [asset]);

  // Apply rotation to voxels
  const voxels = useMemo(() => {
    if (!assetPreview.rotation || assetPreview.rotation === 0) {
      return capturedVoxels;
    }

    // Separate voxel positions from materials
    const positions = capturedVoxels.map(v => [v[0], v[1], v[2]] as [number, number, number]);
    const materials = capturedVoxels.map(v => v[3]);

    // Rotate positions
    const rotatedPositions = rotateVoxels(positions, assetPreview.rotation);

    // Recombine with materials
    return rotatedPositions.map((pos, idx) => [pos[0], pos[1], pos[2], materials[idx]] as [number, number, number, string]);
  }, [capturedVoxels, assetPreview.rotation]);

  if (!asset || voxels.length === 0) return null;

  const [x, y, z] = assetPreview.position;

  return (
    <group position={[x, y, z]}>
      {voxels.map((voxel) => {
        const [vx, vy, vz, materialId] = voxel;
        const materialPreset = MATERIAL_PRESETS[materialId];
        const color = materialPreset?.color || '#cccccc';

        return (
          <mesh key={`${vx}-${vy}-${vz}`} position={[vx, vy, vz]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={color}
              roughness={materialPreset?.roughness ?? 0.7}
              metalness={materialPreset?.metalness ?? 0}
              emissive={materialPreset?.emissive ? parseInt(materialPreset.emissive.slice(1), 16) : 0}
              emissiveIntensity={materialPreset?.emissiveIntensity ?? 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}
