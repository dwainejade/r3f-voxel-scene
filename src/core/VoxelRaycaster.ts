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

    let origin = this.raycaster.ray.origin.clone();
    let direction = this.raycaster.ray.direction.clone();

    // For orthographic cameras, we need to ensure the ray starts from a position
    // that can actually hit voxels. THREE.Raycaster calculates rays for ortho cameras
    // starting at the near plane, but we need them to extend through the entire scene.
    if (camera instanceof THREE.OrthographicCamera) {
      // Move the origin back so the ray passes through the entire scene
      // This is necessary because the orthographic camera's near/far planes
      // might not encompass the entire voxel scene
      const moveDistance = 300; // Move back enough to cover the scene
      origin.addScaledVector(direction, -moveDistance);
    }

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

    // Handle zero direction components (can happen with orthographic cameras)
    const epsilon = 0.00001;
    const dirX = Math.abs(direction.x) < epsilon ? epsilon : direction.x;
    const dirY = Math.abs(direction.y) < epsilon ? epsilon : direction.y;
    const dirZ = Math.abs(direction.z) < epsilon ? epsilon : direction.z;

    const stepX = Math.sign(dirX);
    const stepY = Math.sign(dirY);
    const stepZ = Math.sign(dirZ);


    const tDeltaX = Math.abs(1 / dirX);
    const tDeltaY = Math.abs(1 / dirY);
    const tDeltaZ = Math.abs(1 / dirZ);

    let tMaxX = tDeltaX * (stepX > 0 ? 1 - (origin.x - x) : origin.x - x);
    let tMaxY = tDeltaY * (stepY > 0 ? 1 - (origin.y - y) : origin.y - y);
    let tMaxZ = tDeltaZ * (stepZ > 0 ? 1 - (origin.z - z) : origin.z - z);

    let distance = 0;
    // The normal represents the face we're crossing as we step
    let normal: [number, number, number] = [0, 0, 0];
    let iterations = 0;
    const maxIterations = 1000;

    while (distance < maxDistance && iterations < maxIterations) {
      iterations++;

      // Check if voxel exists
      const voxel = this.getVoxelAt(x, y, z, chunks, chunkSize);
      if (voxel) {
        const chunk = this.getChunkForVoxel(x, y, z, chunks, chunkSize);
        if (chunk) {
          return {
            voxel: [x, y, z],
            normal: normal,
            chunk,
          };
        }
      }

      // Step to next voxel and compute the face normal we're crossing
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          distance = tMaxX;
          tMaxX += tDeltaX;
          x += stepX;
          // We're crossing the YZ plane, so normal points in X direction (direction we're moving)
          normal = [stepX, 0, 0] as [number, number, number];
        } else {
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          z += stepZ;
          // We're crossing the XY plane, so normal points in Z direction (direction we're moving)
          normal = [0, 0, stepZ] as [number, number, number];
        }
      } else {
        if (tMaxY < tMaxZ) {
          distance = tMaxY;
          tMaxY += tDeltaY;
          y += stepY;
          // We're crossing the XZ plane, so normal points in Y direction (direction we're moving)
          normal = [0, stepY, 0] as [number, number, number];
        } else {
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          z += stepZ;
          // We're crossing the XY plane, so normal points in Z direction (direction we're moving)
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
