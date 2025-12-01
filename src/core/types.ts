export type VoxelCoord = `${number},${number},${number}`;

export interface VoxelData {
  materialId: number;
  color?: string;
}

export interface Chunk {
  x: number;
  y: number;
  z: number;
  voxels: Map<VoxelCoord, VoxelData>;
  dirty: boolean;
  mesh?: THREE.Mesh;
}

export interface Scene {
  chunks: Map<string, Chunk>;
  chunkSize: number;
}

export interface RaycastResult {
  voxel: [number, number, number];
  normal: [number, number, number];
  chunk: Chunk;
}

// Import THREE for type reference
import * as THREE from 'three';
