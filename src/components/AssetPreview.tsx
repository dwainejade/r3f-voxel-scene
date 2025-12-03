import { useVoxelStore } from '../store/voxelStore';
import { useFrame, useThree } from '@react-three/fiber';
import { Edges } from '@react-three/drei';

export default function AssetPreview() {
  const assetPreview = useVoxelStore((state) => state.assetPreview);
  const assetLibrary = useVoxelStore((state) => state.assetLibrary);
  const updateAssetPreviewPosition = useVoxelStore((state) => state.updateAssetPreviewPosition);
  const { camera } = useThree();

  const asset = assetPreview.assetId ? assetLibrary.assets.get(assetPreview.assetId) : null;

  // Update preview position on mouse move
  useFrame(({ raycaster, mouse }) => {
    if (!asset || !assetPreview.assetId) return;

    // Raycast to get world position from mouse
    raycaster.setFromCamera(mouse, camera);

    // Simple plane intersection calculation
    const direction = raycaster.ray.direction;
    const origin = raycaster.ray.origin;

    // Solve: origin + t * direction = planePoint (where y component equals previewY)
    const t = (assetPreview.position[1] - origin.y) / direction.y;

    if (t > 0) {
      const x = Math.round(origin.x + t * direction.x);
      const z = Math.round(origin.z + t * direction.z);
      const y = assetPreview.position[1];

      updateAssetPreviewPosition(x, y, z);
    }
  });

  if (!asset) return null;

  const [x, y, z] = assetPreview.position;
  const { width, height, depth } = asset.bounds;

  // Bounding box color based on collision
  const color = assetPreview.canPlace ? '#00ff00' : '#ff0000'; // Green if can place, red if collision

  // Calculate rotated dimensions (swap width/depth based on rotation)
  const rotatedWidth = (assetPreview.rotation === 90 || assetPreview.rotation === 270) ? depth : width;
  const rotatedDepth = (assetPreview.rotation === 90 || assetPreview.rotation === 270) ? width : depth;
  const rotationRad = (assetPreview.rotation * Math.PI) / 180;

  return (
    <group position={[x + rotatedWidth / 2, y + height / 2, z + rotatedDepth / 2]} rotation={[0, rotationRad, 0]}>
      <mesh>
        <boxGeometry args={[rotatedWidth, height, rotatedDepth]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0}
          wireframe={false}
        />
        <Edges scale={1.001} threshold={15} color={color} linewidth={2} />
      </mesh>
    </group>
  );
}
