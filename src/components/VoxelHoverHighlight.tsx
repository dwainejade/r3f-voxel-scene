import { useVoxelStore } from '../store/voxelStore';
import { Edges } from '@react-three/drei';

export default function VoxelHoverHighlight() {
  const hoveredVoxel = useVoxelStore((state) => state.hoveredVoxel);
  const voxelMode = useVoxelStore((state) => state.voxelMode);

  // Only show hover highlight in remove mode
  if (!hoveredVoxel || voxelMode !== 'remove') return null;

  const [x, y, z] = hoveredVoxel;

  return (
    <group position={[x + 0.5, y + 0.5, z + 0.5]}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ff6b6b"
          transparent
          opacity={0.1}
          wireframe={true}
        />
        <Edges scale={1.01} threshold={15} color="#ff6b6b" />
      </mesh>
    </group>
  );
}
