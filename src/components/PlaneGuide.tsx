import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useVoxelStore } from "../store/voxelStore";

export default function PlaneGuide() {
  const meshRef = useRef<THREE.Mesh>(null);
  const planeMode = useVoxelStore((state) => state.planeMode);
  const planePosition = useVoxelStore((state) => state.planePosition);

  useEffect(() => {
    if (!meshRef.current) return;

    // Reset rotation first
    meshRef.current.rotation.set(0, 0, 0);

    // Position the plane based on mode and position
    // PlaneGeometry is oriented in the XZ plane by default (horizontal)
    switch (planeMode) {
      case "x":
        // X plane: rotate 90 degrees around Y axis to face along X
        meshRef.current.position.x = planePosition;
        meshRef.current.rotation.y = Math.PI / 2;
        break;
      case "y":
        // Y plane: default XZ plane orientation is horizontal
        meshRef.current.position.y = planePosition;
        meshRef.current.rotation.x = -Math.PI / 2;
        break;
      case "z":
        // Z plane: no rotation needed, XZ plane naturally shows Z variation
        meshRef.current.position.z = planePosition;
        break;
    }
  }, [planeMode, planePosition]);

  return (
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
  );
}
