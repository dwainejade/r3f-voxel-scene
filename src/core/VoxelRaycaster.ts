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

    let prevVoxelX = Math.floor(origin.x);
    let prevVoxelY = Math.floor(origin.y);
    let prevVoxelZ = Math.floor(origin.z);

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
          // Determine which face we hit by comparing current and previous voxel positions
          // This tells us which voxel boundary we crossed
          const normal: [number, number, number] = [0, 0, 0];

          if (x !== prevVoxelX) {
            normal[0] = x > prevVoxelX ? -1 : 1; // If we moved in +X, we hit the -X face
          } else if (y !== prevVoxelY) {
            normal[1] = y > prevVoxelY ? -1 : 1; // If we moved in +Y, we hit the -Y face
          } else if (z !== prevVoxelZ) {
            normal[2] = z > prevVoxelZ ? -1 : 1; // If we moved in +Z, we hit the -Z face
          }

          const faceNames = ["right(+X)", "left(-X)", "top(+Y)", "bottom(-Y)", "front(+Z)", "back(-Z)"];
          const faceIndex = [
            [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
          ].findIndex(f => f[0] === normal[0] && f[1] === normal[1] && f[2] === normal[2]);
          console.log(`HIT voxel (${x}, ${y}, ${z}), face: ${faceIndex >= 0 ? faceNames[faceIndex] : 'none'} (normal: ${normal}), came from (${prevVoxelX}, ${prevVoxelY}, ${prevVoxelZ})`);

          return {
            voxel: [x, y, z],
            normal: normal as [number, number, number],
            chunk,
          };
        }
      }

      prevVoxelX = x;
      prevVoxelY = y;
      prevVoxelZ = z;
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
