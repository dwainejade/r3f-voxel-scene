import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { Chunk } from '../core/types';
import { InstancedVoxelRenderer } from '../core/InstancedRenderer';
import { MATERIAL_PRESETS } from '../core/materials';

interface Props {
  chunk: Chunk;
}

export default function ChunkRenderer({ chunk }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const instancedRendererRef = useRef<InstancedVoxelRenderer | null>(null);
  const meshesRef = useRef<THREE.InstancedMesh[]>([]);

  // Create THREE materials from preset definitions
  const materials = useMemo(() => {
    const mats = new Map<string, THREE.Material>();

    Object.entries(MATERIAL_PRESETS).forEach(([id, preset]) => {
      const threeMaterial = new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: preset.roughness,
        metalness: preset.metalness,
        emissive: preset.emissive || undefined,
        emissiveIntensity: preset.emissiveIntensity || 0,
        flatShading: false, // Smooth shading for softer look
      });

      mats.set(id, threeMaterial);
    });

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
