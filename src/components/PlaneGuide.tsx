import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useVoxelStore } from "../store/voxelStore";

export default function PlaneGuide() {
  const meshRef = useRef<THREE.Mesh>(null);
  const gridGroupRef = useRef<THREE.Group>(null);
  const planeMode = useVoxelStore((state) => state.planeMode);
  const planePosition = useVoxelStore((state) => state.planePosition);

  useEffect(() => {
    if (!meshRef.current || !gridGroupRef.current) return;

    // Reset rotation first
    meshRef.current.rotation.set(0, 0, 0);
    gridGroupRef.current.rotation.set(0, 0, 0);

    // Offset the plane slightly (0.5 units) so preview voxel isn't cut off
    const planeOffset = 0.5;
    // Offset grid by 0.5 so block centers align with grid squares
    const gridOffset = 0.5;

    // Position the plane based on mode and position
    // PlaneGeometry is oriented in the XZ plane by default (horizontal)
    switch (planeMode) {
      case "x":
        // X plane: rotate 90 degrees around Y axis to face along X
        // Offset towards camera (negative X direction for visibility)
        meshRef.current.position.x = planePosition - planeOffset;
        meshRef.current.rotation.y = Math.PI / 2;
        gridGroupRef.current.position.x = planePosition - planeOffset;
        gridGroupRef.current.position.y = gridOffset;
        gridGroupRef.current.position.z = gridOffset;
        gridGroupRef.current.rotation.z = Math.PI / 2;
        break;
      case "y":
        // Y plane: default XZ plane orientation is horizontal
        // Offset towards camera (negative Y direction for visibility)
        meshRef.current.position.y = planePosition - planeOffset;
        meshRef.current.rotation.x = -Math.PI / 2;
        gridGroupRef.current.position.y = planePosition - planeOffset;
        gridGroupRef.current.position.x = gridOffset;
        gridGroupRef.current.position.z = gridOffset;
        gridGroupRef.current.rotation.y = -Math.PI / 2;
        break;
      case "z":
        // Z plane: no rotation needed, XZ plane naturally shows Z variation
        // Offset towards camera (negative Z direction for visibility)
        meshRef.current.position.z = planePosition - planeOffset;
        gridGroupRef.current.position.z = planePosition - planeOffset;
        gridGroupRef.current.position.x = gridOffset;
        gridGroupRef.current.position.y = gridOffset;
        gridGroupRef.current.rotation.x = -Math.PI / 2;
        break;
    }
  }, [planeMode, planePosition]);

  return (
    <>
      <mesh ref={meshRef}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#4dabf7"
          transparent={true}
          opacity={0.15}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group ref={gridGroupRef}>
        <gridHelper args={[100, 100]} />
      </group>
    </>
  );
}
