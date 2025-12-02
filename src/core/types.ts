export type VoxelCoord = `${number},${number},${number}`;

export interface MaterialDefinition {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export interface VoxelData {
  materialId: string;
}

export type LightType = 'directional' | 'point' | 'spot';

export interface Light {
  id: string;
  type: LightType;
  position: [number, number, number];
  color: string;
  intensity: number;
  castShadow: boolean;
  // Directional specific
  target?: [number, number, number];
  // Point/Spot specific
  distance?: number;
  // Spot specific
  angle?: number;
  penumbra?: number;
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
