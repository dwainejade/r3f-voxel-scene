import { useVoxelStore } from '../store/voxelStore';
import { Edges } from '@react-three/drei';

export default function VoxelMultiSelectionHighlight() {
  const selectedVoxels = useVoxelStore((state) => state.selectedVoxels);
  const getVoxel = useVoxelStore((state) => state.getVoxel);

  if (selectedVoxels.size === 0) return null;

  return (
    <group>
      {Array.from(selectedVoxels).map((key) => {
        const [x, y, z] = key.split(',').map(Number);

        // Only render if the voxel actually exists
        if (!getVoxel(x, y, z)) {
          return null;
        }

        return (
          <group key={key} position={[x, y, z]}>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color="#00ff00"
                transparent
                opacity={0.15}
                wireframe={true}
              />
              <Edges scale={1.01} threshold={15} color="#00ff00" linewidth={2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
