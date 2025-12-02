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

    let prevX: number | null = null;
    let prevY: number | null = null;
    let prevZ: number | null = null;

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

      // Check if we're in a new voxel (and have a previous position to compare to)
      if (prevX !== null && prevY !== null && prevZ !== null && (x !== prevX || y !== prevY || z !== prevZ)) {
        const voxel = this.getVoxelAt(x, y, z, chunks, chunkSize);
        if (voxel) {
          const chunk = this.getChunkForVoxel(x, y, z, chunks, chunkSize);
          if (chunk) {
            // Determine which face we hit by comparing to previous voxel position
            const normal: [number, number, number] = [0, 0, 0];

            if (x !== prevX) {
              normal[0] = x > prevX ? -1 : 1; // If we moved in +X, we hit the -X face
            } else if (y !== prevY) {
              normal[1] = y > prevY ? -1 : 1; // If we moved in +Y, we hit the -Y face
            } else if (z !== prevZ) {
              normal[2] = z > prevZ ? -1 : 1; // If we moved in +Z, we hit the -Z face
            }

            return {
              voxel: [x, y, z],
              normal: normal as [number, number, number],
              chunk,
            };
          }
        }
      }

      prevX = x;
      prevY = y;
      prevZ = z;
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
