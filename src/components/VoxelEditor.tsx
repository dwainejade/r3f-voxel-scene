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
      100
    );

    if (placementMode === 'plane') {
      // PLANE MODE: Show preview on the plane
      const tempRaycaster = new THREE.Raycaster();
      const mouseVec = new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y);
      tempRaycaster.setFromCamera(mouseVec, camera);

      let x = 0, y = 0, z = 0;
      const epsilon = 0.0001;

      if (planeMode === 'y') {
        if (Math.abs(tempRaycaster.ray.direction.y) < epsilon) {
          setPreviewVoxel(null);
          return;
        }
        const t = (planePosition - camera.position.y) / tempRaycaster.ray.direction.y;
        x = Math.round(camera.position.x + tempRaycaster.ray.direction.x * t);
        y = Math.round(planePosition);
        z = Math.round(camera.position.z + tempRaycaster.ray.direction.z * t);
      } else if (planeMode === 'x') {
        if (Math.abs(tempRaycaster.ray.direction.x) < epsilon) {
          setPreviewVoxel(null);
          return;
        }
        const t = (planePosition - camera.position.x) / tempRaycaster.ray.direction.x;
        x = Math.round(planePosition);
        y = Math.round(camera.position.y + tempRaycaster.ray.direction.y * t);
        z = Math.round(camera.position.z + tempRaycaster.ray.direction.z * t);
      } else {
        if (Math.abs(tempRaycaster.ray.direction.z) < epsilon) {
          setPreviewVoxel(null);
          return;
        }
        const t = (planePosition - camera.position.z) / tempRaycaster.ray.direction.z;
        x = Math.round(camera.position.x + tempRaycaster.ray.direction.x * t);
        y = Math.round(camera.position.y + tempRaycaster.ray.direction.y * t);
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
      100
    );

    if (e.button === 0) {
      // Left click - place voxel
      const voxel: VoxelData = { materialId: currentMaterial };

      if (placementMode === 'plane') {
        // PLANE MODE: Place on constrained plane
        console.log(`\n=== LEFT CLICK (PLANE MODE) ===`);
        console.log(`planeMode: "${planeMode}", planePosition: ${planePosition}`);

        // Create a ray from the camera through the mouse position
        const tempRaycaster = new THREE.Raycaster();
        const mouseVec = new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y);
        tempRaycaster.setFromCamera(mouseVec, camera);

        // Find intersection with plane
        let x = 0, y = 0, z = 0;
        const epsilon = 0.0001;

        console.log(`ray direction: (${tempRaycaster.ray.direction.x.toFixed(3)}, ${tempRaycaster.ray.direction.y.toFixed(3)}, ${tempRaycaster.ray.direction.z.toFixed(3)})`);

        if (planeMode === 'y') {
          // Y plane - calculate X and Z from ray intersection with Y plane
          if (Math.abs(tempRaycaster.ray.direction.y) < epsilon) {
            console.log('Y plane: ray is parallel to plane');
            return;
          }
          const t = (planePosition - camera.position.y) / tempRaycaster.ray.direction.y;
          x = Math.round(camera.position.x + tempRaycaster.ray.direction.x * t);
          y = Math.round(planePosition);
          z = Math.round(camera.position.z + tempRaycaster.ray.direction.z * t);
          console.log(`Y Plane click: t=${t.toFixed(2)}, calculated (${x}, ${y}, ${z})`);
        } else if (planeMode === 'x') {
          // X plane - calculate Y and Z from ray intersection with X plane
          if (Math.abs(tempRaycaster.ray.direction.x) < epsilon) {
            console.log('X plane: ray is parallel to plane');
            return;
          }
          const t = (planePosition - camera.position.x) / tempRaycaster.ray.direction.x;
          x = Math.round(planePosition);
          y = Math.round(camera.position.y + tempRaycaster.ray.direction.y * t);
          z = Math.round(camera.position.z + tempRaycaster.ray.direction.z * t);
          console.log(`X Plane click: t=${t.toFixed(2)}, calculated (${x}, ${y}, ${z})`);
        } else {
          // Z plane - calculate X and Y from ray intersection with Z plane
          if (Math.abs(tempRaycaster.ray.direction.z) < epsilon) {
            console.log('Z plane: ray is parallel to plane');
            return;
          }
          const t = (planePosition - camera.position.z) / tempRaycaster.ray.direction.z;
          x = Math.round(camera.position.x + tempRaycaster.ray.direction.x * t);
          y = Math.round(camera.position.y + tempRaycaster.ray.direction.y * t);
          z = Math.round(planePosition);
          console.log(`Z Plane click: t=${t.toFixed(2)}, calculated (${x}, ${y}, ${z})`);
        }

        setVoxel(x, y, z, voxel);
      } else {
        // FREE MODE: Raycast and place adjacent to hit voxel (Minecraft-style)
        console.log(`\n=== LEFT CLICK (FREE MODE) ===`);

        if (result) {
          const [hitX, hitY, hitZ] = result.voxel;
          const [normalX, normalY, normalZ] = result.normal;

          // Place voxel on the face of the hit voxel
          const newX = hitX + normalX;
          const newY = hitY + normalY;
          const newZ = hitZ + normalZ;

          console.log(`Hit voxel: (${hitX}, ${hitY}, ${hitZ}), normal: (${normalX}, ${normalY}, ${normalZ})`);
          console.log(`Placing at: (${newX}, ${newY}, ${newZ})`);

          setVoxel(newX, newY, newZ, voxel);
        } else {
          console.log('No voxel hit - cannot place in free mode');
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
