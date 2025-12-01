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

    const origin = this.raycaster.ray.origin;
    const direction = this.raycaster.ray.direction;

    // DDA (Digital Differential Analyzer) algorithm
    return this.dda(origin, direction, chunks, chunkSize, maxDistance);
  }

  private dda(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    chunks: Map<string, Chunk>,
    chunkSize: number,
    maxDistance: number
  ): RaycastResult | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);

    const tDeltaX = Math.abs(1 / direction.x);
    const tDeltaY = Math.abs(1 / direction.y);
    const tDeltaZ = Math.abs(1 / direction.z);

    let tMaxX = tDeltaX * (stepX > 0 ? 1 - (origin.x - x) : origin.x - x);
    let tMaxY = tDeltaY * (stepY > 0 ? 1 - (origin.y - y) : origin.y - y);
    let tMaxZ = tDeltaZ * (stepZ > 0 ? 1 - (origin.z - z) : origin.z - z);

    let distance = 0;
    let normal: [number, number, number] = [1, 0, 0];

    while (distance < maxDistance) {
      // Check if voxel exists
      const voxel = this.getVoxelAt(x, y, z, chunks, chunkSize);
      if (voxel) {
        const chunk = this.getChunkForVoxel(x, y, z, chunks, chunkSize);
        if (chunk) {
          return {
            voxel: [x, y, z],
            normal,
            chunk,
          };
        }
      }

      // Step to next voxel and compute normal for next face we'll hit
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          distance = tMaxX;
          tMaxX += tDeltaX;
          x += stepX;
          normal = [stepX, 0, 0] as [number, number, number];
        } else {
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          z += stepZ;
          normal = [0, 0, stepZ] as [number, number, number];
        }
      } else {
        if (tMaxY < tMaxZ) {
          distance = tMaxY;
          tMaxY += tDeltaY;
          y += stepY;
          normal = [0, stepY, 0] as [number, number, number];
        } else {
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          z += stepZ;
          normal = [0, 0, stepZ] as [number, number, number];
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

    if (!chunk) return null;

    const voxelKey = `${localX},${localY},${localZ}`;
    return chunk.voxels.get(voxelKey as any) || null;
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
