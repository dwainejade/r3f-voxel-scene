import { useVoxelStore } from '../store/voxelStore';
import { Edges } from '@react-three/drei';

export default function VoxelSelectionHighlight() {
  const selectedVoxel = useVoxelStore((state) => state.selectedVoxel);
  const getVoxel = useVoxelStore((state) => state.getVoxel);

  if (!selectedVoxel) return null;

  const [x, y, z] = selectedVoxel;

  // Only render if the voxel actually exists
  if (!getVoxel(x, y, z)) {
    return null;
  }

  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ffaa00"
          transparent
          opacity={0.2}
          wireframe={true}
        />
        <Edges scale={1.01} threshold={15} color="#ffaa00" />
      </mesh>
    </group>
  );
}
