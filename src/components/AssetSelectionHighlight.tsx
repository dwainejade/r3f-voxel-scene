import { useVoxelStore } from '../store/voxelStore';
import { Edges } from '@react-three/drei';

export default function AssetSelectionHighlight() {
  const selectedAsset = useVoxelStore((state) => state.selectedAsset);
  const getAssetVoxels = useVoxelStore((state) => state.getAssetVoxels);

  if (!selectedAsset) return null;

  const voxels = getAssetVoxels(selectedAsset);

  return (
    <group>
      {voxels.map((voxel, idx) => {
        const [x, y, z] = voxel;
        return (
          <group key={idx} position={[x + 0.5, y + 0.5, z + 0.5]}>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color="#ffd700"
                transparent
                opacity={0.15}
                wireframe={true}
              />
              <Edges scale={1.01} threshold={15} color="#ffd700" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
