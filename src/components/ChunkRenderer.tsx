import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { Chunk } from '../core/types';
import { InstancedVoxelRenderer } from '../core/InstancedRenderer';

interface Props {
  chunk: Chunk;
}

export default function ChunkRenderer({ chunk }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const instancedRendererRef = useRef<InstancedVoxelRenderer | null>(null);
  const meshesRef = useRef<THREE.InstancedMesh[]>([]);

  // Create materials for different material IDs
  const materials = useMemo(() => {
    const mats = new Map<number, THREE.Material>();

    // Material 0 - Red
    mats.set(0, new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      roughness: 0.8,
      metalness: 0,
      flatShading: true
    }));

    // Material 1 - Green
    mats.set(1, new THREE.MeshStandardMaterial({
      color: 0x51cf66,
      roughness: 0.8,
      metalness: 0,
      flatShading: true
    }));

    // Material 2 - Blue
    mats.set(2, new THREE.MeshStandardMaterial({
      color: 0x4dabf7,
      roughness: 0.8,
      metalness: 0,
      flatShading: true
    }));

    // Material 3 - Yellow
    mats.set(3, new THREE.MeshStandardMaterial({
      color: 0xffd43b,
      roughness: 0.8,
      metalness: 0,
      flatShading: true
    }));

    // Material 4 - Purple
    mats.set(4, new THREE.MeshStandardMaterial({
      color: 0xda77f2,
      roughness: 0.8,
      metalness: 0,
      flatShading: true
    }));

    return mats;
  }, []);

  // Initialize instanced renderer and keep meshes attached
  useEffect(() => {
    if (!instancedRendererRef.current) {
      instancedRendererRef.current = new InstancedVoxelRenderer(materials);

      // Add all material meshes to group once
      if (groupRef.current) {
        const meshes = instancedRendererRef.current.getMeshes();
        meshes.forEach((mesh) => {
          groupRef.current?.add(mesh);
        });
        meshesRef.current = meshes;
      }
    }

    // Just update the instances, don't recreate meshes
    if (instancedRendererRef.current) {
      instancedRendererRef.current.updateInstances(chunk);
    }
  }, [chunk.voxels.size, chunk.x, chunk.y, chunk.z, materials]);

  const chunkSize = 16;
  const chunkOffset = [
    chunk.x * chunkSize,
    chunk.y * chunkSize,
    chunk.z * chunkSize,
  ] as const;

  return (
    <group
      ref={groupRef}
      position={chunkOffset}
      userData={{ chunk }}
    />
  );
}
