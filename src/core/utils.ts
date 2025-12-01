import type { VoxelCoord } from './types';

export function worldToChunk(
  x: number,
  y: number,
  z: number,
  chunkSize: number
) {
  return {
    chunkX: Math.floor(x / chunkSize),
    chunkY: Math.floor(y / chunkSize),
    chunkZ: Math.floor(z / chunkSize),
    localX: ((x % chunkSize) + chunkSize) % chunkSize,
    localY: ((y % chunkSize) + chunkSize) % chunkSize,
    localZ: ((z % chunkSize) + chunkSize) % chunkSize,
  };
}

export function chunkKey(cx: number, cy: number, cz: number): string {
  return `${cx},${cy},${cz}`;
}

export function voxelKey(x: number, y: number, z: number): VoxelCoord {
  return `${x},${y},${z}`;
}
