import { useVoxelStore } from '../store/voxelStore';
import { Edges } from '@react-three/drei';

export default function VoxelSelectionHighlight() {
  const selectedVoxel = useVoxelStore((state) => state.selectedVoxel);

  if (!selectedVoxel) return null;

  const [x, y, z] = selectedVoxel;

  return (
    <group position={[x + 0.5, y + 0.5, z + 0.5]}>
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
