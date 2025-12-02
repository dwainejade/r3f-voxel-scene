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
  const isDraggingRef = useRef(false);
  const isShiftPaintingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  const scene = useVoxelStore((state) => state.scene);
  const currentMaterial = useVoxelStore((state) => state.currentMaterial);
  const planeMode = useVoxelStore((state) => state.planeMode);
  const planePosition = useVoxelStore((state) => state.planePosition);
  const placementMode = useVoxelStore((state) => state.placementMode);
  const setVoxel = useVoxelStore((state) => state.setVoxel);
  const removeVoxel = useVoxelStore((state) => state.removeVoxel);
  const setPreviewVoxel = useVoxelStore((state) => state.setPreviewVoxel);
  const getVoxel = useVoxelStore((state) => state.getVoxel);

  const placeVoxelAt = useCallback((x: number, y: number, z: number) => {
    const voxel: VoxelData = { materialId: currentMaterial };
    setVoxel(x, y, z, voxel);
  }, [currentMaterial, setVoxel]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const newPos = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
    mousePosRef.current = newPos;

    // Track if we're dragging
    if (isDraggingRef.current) {
      const dx = newPos.x - mouseDownPosRef.current.x;
      const dy = newPos.y - mouseDownPosRef.current.y;
      const dragDistance = Math.sqrt(dx * dx + dy * dy);

      // If shift is held and we're dragging, do continuous painting
      if (isShiftPaintingRef.current && dragDistance > 0.01) {
        const raycaster = raycasterRef.current;
        const result = raycaster.castRay(
          camera,
          mousePosRef.current,
          scene.chunks,
          scene.chunkSize,
          400
        );

        if (placementMode === 'plane') {
          const tempRaycaster = new THREE.Raycaster();
          const mouseVec = new THREE.Vector2(newPos.x, newPos.y);
          tempRaycaster.setFromCamera(mouseVec, camera);

          let x = 0, y = 0, z = 0;
          const epsilon = 0.0001;
          const rayOrigin = tempRaycaster.ray.origin;
          const rayDir = tempRaycaster.ray.direction;

          if (planeMode === 'y') {
            if (Math.abs(rayDir.y) >= epsilon) {
              const t = (planePosition - rayOrigin.y) / rayDir.y;
              x = Math.round(rayOrigin.x + rayDir.x * t);
              y = Math.round(planePosition);
              z = Math.round(rayOrigin.z + rayDir.z * t);
              placeVoxelAt(x, y, z);
            }
          } else if (planeMode === 'x') {
            if (Math.abs(rayDir.x) >= epsilon) {
              const t = (planePosition - rayOrigin.x) / rayDir.x;
              x = Math.round(planePosition);
              y = Math.round(rayOrigin.y + rayDir.y * t);
              z = Math.round(rayOrigin.z + rayDir.z * t);
              placeVoxelAt(x, y, z);
            }
          } else {
            if (Math.abs(rayDir.z) >= epsilon) {
              const t = (planePosition - rayOrigin.z) / rayDir.z;
              x = Math.round(rayOrigin.x + rayDir.x * t);
              y = Math.round(rayOrigin.y + rayDir.y * t);
              z = Math.round(planePosition);
              placeVoxelAt(x, y, z);
            }
          }
        } else {
          // FREE MODE: Paint adjacent to hit voxel
          if (result) {
            const [hitX, hitY, hitZ] = result.voxel;
            const [normalX, normalY, normalZ] = result.normal;
            const newX = hitX + normalX;
            const newY = hitY + normalY;
            const newZ = hitZ + normalZ;
            placeVoxelAt(newX, newY, newZ);
          }
        }
      }
    }

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

        // Only show preview if the target position is empty (Minecraft-style)
        const targetVoxel = getVoxel(newX, newY, newZ);
        if (!targetVoxel) {
          setPreviewVoxel([newX, newY, newZ]);
        } else {
          setPreviewVoxel(null);
        }
      } else {
        setPreviewVoxel(null);
      }
    }
  }, [canvas, camera, scene, planeMode, planePosition, placementMode, setPreviewVoxel, getVoxel, placeVoxelAt]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Prevent right-click context menu
    if (e.button === 2) {
      e.preventDefault();
    }

    // Track that we're starting a potential drag
    isDraggingRef.current = true;
    isShiftPaintingRef.current = e.shiftKey && e.button === 0;
    mouseDownPosRef.current = { ...mousePosRef.current };

    // Prevent OrbitControls from panning when shift+dragging
    if (e.shiftKey && e.button === 0) {
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

    if (e.button === 0 && !e.shiftKey) {
      // Left click (without shift) - place voxel only if we don't drag
      // We'll check on mouseUp if this was a click or drag
    } else if (e.button === 2) {
      // Right click - remove voxel
      if (result) {
        const [x, y, z] = result.voxel;
        removeVoxel(x, y, z);
      }
    }
  }, [camera, scene, removeVoxel]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    const wasClick = isDraggingRef.current && (
      Math.abs(mousePosRef.current.x - mouseDownPosRef.current.x) < 0.05 &&
      Math.abs(mousePosRef.current.y - mouseDownPosRef.current.y) < 0.05
    );

    isDraggingRef.current = false;
    isShiftPaintingRef.current = false;

    // Only place a voxel if this was a click (not a drag) and not shift+drag
    if (e.button === 0 && wasClick && !e.shiftKey) {
      const raycaster = raycasterRef.current;
      const result = raycaster.castRay(
        camera,
        mousePosRef.current,
        scene.chunks,
        scene.chunkSize,
        400
      );

      if (placementMode === 'plane') {
        const tempRaycaster = new THREE.Raycaster();
        const mouseVec = new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y);
        tempRaycaster.setFromCamera(mouseVec, camera);

        let x = 0, y = 0, z = 0;
        const epsilon = 0.0001;
        const rayOrigin = tempRaycaster.ray.origin;
        const rayDir = tempRaycaster.ray.direction;

        if (planeMode === 'y') {
          if (Math.abs(rayDir.y) >= epsilon) {
            const t = (planePosition - rayOrigin.y) / rayDir.y;
            x = Math.round(rayOrigin.x + rayDir.x * t);
            y = Math.round(planePosition);
            z = Math.round(rayOrigin.z + rayDir.z * t);
            placeVoxelAt(x, y, z);
          }
        } else if (planeMode === 'x') {
          if (Math.abs(rayDir.x) >= epsilon) {
            const t = (planePosition - rayOrigin.x) / rayDir.x;
            x = Math.round(planePosition);
            y = Math.round(rayOrigin.y + rayDir.y * t);
            z = Math.round(rayOrigin.z + rayDir.z * t);
            placeVoxelAt(x, y, z);
          }
        } else {
          if (Math.abs(rayDir.z) >= epsilon) {
            const t = (planePosition - rayOrigin.z) / rayDir.z;
            x = Math.round(rayOrigin.x + rayDir.x * t);
            y = Math.round(rayOrigin.y + rayDir.y * t);
            z = Math.round(planePosition);
            placeVoxelAt(x, y, z);
          }
        }
      } else {
        // FREE MODE: Place adjacent to hit voxel
        if (result) {
          const [hitX, hitY, hitZ] = result.voxel;
          const [normalX, normalY, normalZ] = result.normal;
          const newX = hitX + normalX;
          const newY = hitY + normalY;
          const newZ = hitZ + normalZ;
          placeVoxelAt(newX, newY, newZ);
        }
      }
    }
  }, [camera, scene, placementMode, planeMode, planePosition, placeVoxelAt]);

  // Track mouse position
  useEffect(() => {
    const handleMouseLeave = () => {
      setPreviewVoxel(null);
      isDraggingRef.current = false;
      isShiftPaintingRef.current = false;
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
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [canvas, handleMouseDown, handleMouseUp, handleContextMenu]);

  return null;
}
