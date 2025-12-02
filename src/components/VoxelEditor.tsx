import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVoxelStore } from '../store/voxelStore';
import { VoxelRaycaster } from '../core/VoxelRaycaster';
import type { VoxelData } from '../core/types';

export default function VoxelEditor() {
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);

  const raycasterRef = useRef(new VoxelRaycaster());
  const mousePosRef = useRef({ x: 0, y: 0 });

  const scene = useVoxelStore((state) => state.scene);
  const currentMaterial = useVoxelStore((state) => state.currentMaterial);
  const planeMode = useVoxelStore((state) => state.planeMode);
  const planePosition = useVoxelStore((state) => state.planePosition);
  const placementMode = useVoxelStore((state) => state.placementMode);
  const setVoxel = useVoxelStore((state) => state.setVoxel);
  const removeVoxel = useVoxelStore((state) => state.removeVoxel);
  const setPreviewVoxel = useVoxelStore((state) => state.setPreviewVoxel);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };

    // Calculate preview voxel position
    const raycaster = raycasterRef.current;
    const result = raycaster.castRay(
      camera,
      mousePosRef.current,
      scene.chunks,
      scene.chunkSize,
      400 // Extended range for orthographic camera adjustment
    );

    if (placementMode === 'plane') {
      // PLANE MODE: Show preview on the plane
      const tempRaycaster = new THREE.Raycaster();
      const mouseVec = new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y);
      tempRaycaster.setFromCamera(mouseVec, camera);

      let x = 0, y = 0, z = 0;
      const epsilon = 0.0001;
      const rayOrigin = tempRaycaster.ray.origin;
      const rayDir = tempRaycaster.ray.direction;

      if (planeMode === 'y') {
        if (Math.abs(rayDir.y) < epsilon) {
          setPreviewVoxel(null);
          return;
        }
        const t = (planePosition - rayOrigin.y) / rayDir.y;
        x = Math.round(rayOrigin.x + rayDir.x * t);
        y = Math.round(planePosition);
        z = Math.round(rayOrigin.z + rayDir.z * t);
      } else if (planeMode === 'x') {
        if (Math.abs(rayDir.x) < epsilon) {
          setPreviewVoxel(null);
          return;
        }
        const t = (planePosition - rayOrigin.x) / rayDir.x;
        x = Math.round(planePosition);
        y = Math.round(rayOrigin.y + rayDir.y * t);
        z = Math.round(rayOrigin.z + rayDir.z * t);
      } else {
        if (Math.abs(rayDir.z) < epsilon) {
          setPreviewVoxel(null);
          return;
        }
        const t = (planePosition - rayOrigin.z) / rayDir.z;
        x = Math.round(rayOrigin.x + rayDir.x * t);
        y = Math.round(rayOrigin.y + rayDir.y * t);
        z = Math.round(planePosition);
      }

      setPreviewVoxel([x, y, z]);
    } else {
      // FREE MODE: Show preview adjacent to hit voxel
      if (result) {
        const [hitX, hitY, hitZ] = result.voxel;
        const [normalX, normalY, normalZ] = result.normal;

        const newX = hitX + normalX;
        const newY = hitY + normalY;
        const newZ = hitZ + normalZ;

        console.log(`PREVIEW FREE - Hit: (${hitX}, ${hitY}, ${hitZ}), Normal: (${normalX}, ${normalY}, ${normalZ}), Preview at: (${newX}, ${newY}, ${newZ})`);
        setPreviewVoxel([newX, newY, newZ]);
      } else {
        setPreviewVoxel(null);
      }
    }
  }, [canvas, camera, scene, planeMode, planePosition, placementMode, setPreviewVoxel]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Prevent right-click context menu
    if (e.button === 2) {
      e.preventDefault();
    }

    const raycaster = raycasterRef.current;
    const result = raycaster.castRay(
      camera,
      mousePosRef.current,
      scene.chunks,
      scene.chunkSize,
      400 // Extended range for orthographic camera adjustment
    );

    if (e.button === 0) {
      // Left click - place voxel
      const voxel: VoxelData = { materialId: currentMaterial };

      if (placementMode === 'plane') {
        // PLANE MODE: Place on constrained plane
        const tempRaycaster = new THREE.Raycaster();
        const mouseVec = new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y);
        tempRaycaster.setFromCamera(mouseVec, camera);

        // Find intersection with plane
        let x = 0, y = 0, z = 0;
        const epsilon = 0.0001;
        const rayOrigin = tempRaycaster.ray.origin;
        const rayDir = tempRaycaster.ray.direction;

        if (planeMode === 'y') {
          // Y plane - calculate X and Z from ray intersection with Y plane
          if (Math.abs(rayDir.y) < epsilon) {
            return;
          }
          const t = (planePosition - rayOrigin.y) / rayDir.y;
          x = Math.round(rayOrigin.x + rayDir.x * t);
          y = Math.round(planePosition);
          z = Math.round(rayOrigin.z + rayDir.z * t);
        } else if (planeMode === 'x') {
          // X plane - calculate Y and Z from ray intersection with X plane
          if (Math.abs(rayDir.x) < epsilon) {
            return;
          }
          const t = (planePosition - rayOrigin.x) / rayDir.x;
          x = Math.round(planePosition);
          y = Math.round(rayOrigin.y + rayDir.y * t);
          z = Math.round(rayOrigin.z + rayDir.z * t);
        } else {
          // Z plane - calculate X and Y from ray intersection with Z plane
          if (Math.abs(rayDir.z) < epsilon) {
            return;
          }
          const t = (planePosition - rayOrigin.z) / rayDir.z;
          x = Math.round(rayOrigin.x + rayDir.x * t);
          y = Math.round(rayOrigin.y + rayDir.y * t);
          z = Math.round(planePosition);
        }

        setVoxel(x, y, z, voxel);
      } else {
        // FREE MODE: Raycast and place adjacent to hit voxel (Minecraft-style)
        if (result) {
          const [hitX, hitY, hitZ] = result.voxel;
          const [normalX, normalY, normalZ] = result.normal;

          // Place voxel on the face of the hit voxel
          const newX = hitX + normalX;
          const newY = hitY + normalY;
          const newZ = hitZ + normalZ;

          console.log(`PLACE FREE - Hit: (${hitX}, ${hitY}, ${hitZ}), Normal: (${normalX}, ${normalY}, ${normalZ}), Placing at: (${newX}, ${newY}, ${newZ}), Material: ${currentMaterial}`);
          setVoxel(newX, newY, newZ, voxel);
        }
      }
    } else if (e.button === 2) {
      // Right click - remove voxel
      if (result) {
        const [x, y, z] = result.voxel;
        removeVoxel(x, y, z);
      }
    }
  }, [camera, scene, currentMaterial, planeMode, planePosition, placementMode, setVoxel, removeVoxel]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseLeave = () => {
      setPreviewVoxel(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [canvas, handleMouseMove, setPreviewVoxel]);

  // Handle mouse clicks
  useEffect(() => {
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [canvas, handleMouseDown, handleContextMenu]);

  return null;
}
