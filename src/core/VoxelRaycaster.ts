import * as THREE from 'three';
import type { RaycastResult, VoxelData, Chunk } from './types';
import { worldToChunk, chunkKey } from './utils';

export class VoxelRaycaster {
  private raycaster = new THREE.Raycaster();

  castRay(
    camera: THREE.Camera,
    mouse: { x: number; y: number },
    chunks: Map<string, Chunk>,
    chunkSize: number,
    maxDistance = 100
  ): RaycastResult | null {
    const mouseVec = new THREE.Vector2(mouse.x, mouse.y);
    this.raycaster.setFromCamera(mouseVec, camera);

    const origin = this.raycaster.ray.origin.clone();
    const direction = this.raycaster.ray.direction.clone();

    // Use simple stepping algorithm: step along the ray in small increments
    const stepSize = 0.5; // Check every 0.5 units along the ray
    let distance = 0;
    const maxSteps = Math.ceil(maxDistance / stepSize);

    for (let i = 0; i < maxSteps; i++) {
      distance = i * stepSize;

      // Calculate position along ray
      const pos = new THREE.Vector3(
        origin.x + direction.x * distance,
        origin.y + direction.y * distance,
        origin.z + direction.z * distance
      );

      const x = Math.floor(pos.x);
      const y = Math.floor(pos.y);
      const z = Math.floor(pos.z);

      // Check if voxel exists at this position
      const voxel = this.getVoxelAt(x, y, z, chunks, chunkSize);
      if (voxel) {
        const chunk = this.getChunkForVoxel(x, y, z, chunks, chunkSize);
        if (chunk) {
          // Calculate which face we hit (approximate based on last position)
          const prevPos = new THREE.Vector3(
            origin.x + direction.x * Math.max(0, distance - stepSize),
            origin.y + direction.y * Math.max(0, distance - stepSize),
            origin.z + direction.z * Math.max(0, distance - stepSize)
          );

          const normal: [number, number, number] = [0, 0, 0];
          const dx = pos.x - prevPos.x;
          const dy = pos.y - prevPos.y;
          const dz = pos.z - prevPos.z;

          // Determine which axis had the largest change
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > Math.abs(dz)) {
            normal[0] = Math.sign(dx);
          } else if (Math.abs(dy) > Math.abs(dz)) {
            normal[1] = Math.sign(dy);
          } else {
            normal[2] = Math.sign(dz);
          }

          return {
            voxel: [x, y, z],
            normal: normal as [number, number, number],
            chunk,
          };
        }
      }
    }
    return null;
  }

  private getVoxelAt(
    x: number,
    y: number,
    z: number,
    chunks: Map<string, Chunk>,
    chunkSize: number
  ): VoxelData | null {
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      x,
      y,
      z,
      chunkSize
    );
    const key = chunkKey(chunkX, chunkY, chunkZ);
    const chunk = chunks.get(key);

    if (!chunk) {
      return null;
    }

    const voxelKey = `${localX},${localY},${localZ}`;
    const result = chunk.voxels.get(voxelKey as any);
    return result || null;
  }

  private getChunkForVoxel(
    x: number,
    y: number,
    z: number,
    chunks: Map<string, Chunk>,
    chunkSize: number
  ): Chunk | null {
    const { chunkX, chunkY, chunkZ } = worldToChunk(x, y, z, chunkSize);
    const key = chunkKey(chunkX, chunkY, chunkZ);
    return chunks.get(key) || null;
  }
}
