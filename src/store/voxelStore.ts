import { create } from 'zustand';
import type { Chunk, VoxelData, Scene } from '../core/types';
import { worldToChunk, chunkKey, voxelKey } from '../core/utils';

const MAX_VOXELS = 1000000; // 1 million voxels for stress testing
const GRID_SIZE = 10; // 10x10x10 grid

type PlaneMode = 'x' | 'y' | 'z';

interface VoxelStore {
  scene: Scene;
  gridSize: number;
  editMode: boolean;
  selectedVoxel: [number, number, number] | null;
  currentMaterial: number;
  sceneVersion: number;
  voxelCount: number;
  planeMode: PlaneMode;
  planePosition: number;

  // Actions - Voxel Operations
  setVoxel: (x: number, y: number, z: number, voxel: VoxelData) => void;
  removeVoxel: (x: number, y: number, z: number) => void;
  getVoxel: (x: number, y: number, z: number) => VoxelData | null;

  // Actions - Chunk Management
  getChunk: (cx: number, cy: number, cz: number) => Chunk | null;
  markChunkDirty: (cx: number, cy: number, cz: number) => void;
  getOrCreateChunk: (cx: number, cy: number, cz: number) => Chunk;

  // Actions - Mode Switching
  setEditMode: (enabled: boolean) => void;

  // Actions - Material Selection
  setCurrentMaterial: (materialId: number) => void;

  // Actions - Scene Management
  clearScene: () => void;
  stressTest: (count: number) => void;

  // Actions - Plane Mode
  setPlaneMode: (mode: PlaneMode) => void;
  setPlanePosition: (position: number) => void;
  movePlane: (direction: -1 | 1) => void;
}

export const useVoxelStore = create<VoxelStore>((set, get) => ({
  scene: { chunks: new Map(), chunkSize: 16 },
  gridSize: GRID_SIZE,
  editMode: true,
  selectedVoxel: null,
  currentMaterial: 0,
  sceneVersion: 0,
  voxelCount: 0,
  planeMode: 'y',
  planePosition: 0,

  setVoxel: (x, y, z, voxel) => {
    const state = get();
    const gridSize = state.gridSize;
    const half = Math.floor(gridSize / 2);

    // Clamp coordinates to grid bounds
    const clampedX = Math.max(-half, Math.min(half, Math.round(x)));
    const clampedY = Math.max(-half, Math.min(half, Math.round(y)));
    const clampedZ = Math.max(-half, Math.min(half, Math.round(z)));

    console.log(`setVoxel: requested (${x}, ${y}, ${z}) -> clamped (${clampedX}, ${clampedY}, ${clampedZ})`);

    // Check if voxel already exists
    const existing = state.getVoxel(clampedX, clampedY, clampedZ);
    if (existing) {
      console.log(`  Already has voxel at (${clampedX}, ${clampedY}, ${clampedZ})`);
      return;
    }

    // Check limit
    if (state.voxelCount >= MAX_VOXELS) {
      console.warn(`Cannot place voxel - max voxel limit (${MAX_VOXELS}) reached`);
      return;
    }

    const { chunkSize } = state.scene;
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } =
      worldToChunk(clampedX, clampedY, clampedZ, chunkSize);

    const chunk = state.getOrCreateChunk(chunkX, chunkY, chunkZ);
    const key = voxelKey(localX, localY, localZ);
    chunk.voxels.set(key, voxel);
    chunk.dirty = true;

    console.log(`  Placed voxel at (${clampedX}, ${clampedY}, ${clampedZ}) in chunk (${chunkX}, ${chunkY}, ${chunkZ})`);

    set({
      voxelCount: state.voxelCount + 1,
      sceneVersion: state.sceneVersion + 1
    });
  },

  removeVoxel: (x, y, z) => {
    const state = get();
    const { chunkSize } = state.scene;
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } =
      worldToChunk(x, y, z, chunkSize);

    const chunk = state.getChunk(chunkX, chunkY, chunkZ);
    if (!chunk) return;

    const key = voxelKey(localX, localY, localZ);
    const existed = chunk.voxels.delete(key);
    if (!existed) return;

    chunk.dirty = true;

    set({
      voxelCount: Math.max(0, state.voxelCount - 1),
      sceneVersion: state.sceneVersion + 1
    });
  },

  getVoxel: (x, y, z) => {
    const { chunkSize } = get().scene;
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } =
      worldToChunk(x, y, z, chunkSize);

    const chunk = get().getChunk(chunkX, chunkY, chunkZ);
    if (!chunk) return null;

    const key = voxelKey(localX, localY, localZ);
    return chunk.voxels.get(key) || null;
  },

  getChunk: (cx, cy, cz) => {
    const key = chunkKey(cx, cy, cz);
    return get().scene.chunks.get(key) || null;
  },

  getOrCreateChunk: (cx, cy, cz) => {
    const key = chunkKey(cx, cy, cz);
    let chunk = get().scene.chunks.get(key);

    if (!chunk) {
      chunk = {
        x: cx,
        y: cy,
        z: cz,
        voxels: new Map(),
        dirty: true,
      };
      get().scene.chunks.set(key, chunk);
    }

    return chunk;
  },

  markChunkDirty: (cx, cy, cz) => {
    const chunk = get().getChunk(cx, cy, cz);
    if (chunk) {
      chunk.dirty = true;
      set({ sceneVersion: get().sceneVersion + 1 });
    }
  },

  setEditMode: (enabled) => set({ editMode: enabled }),
  setCurrentMaterial: (materialId) => set({ currentMaterial: materialId }),

  clearScene: () => {
    set({
      scene: { chunks: new Map(), chunkSize: 16 },
      selectedVoxel: null,
      sceneVersion: 0,
      voxelCount: 0,
    });
  },

  stressTest: (count) => {
    const state = get();
    const { chunkSize } = state.scene;
    let placed = 0;

    console.time(`Stress Test - Placing ${count} voxels`);
    console.log(`Starting stress test: placing ${count} voxels`);

    // Clear scene first
    set({
      scene: { chunks: new Map(), chunkSize: 16 },
      selectedVoxel: null,
      sceneVersion: 0,
      voxelCount: 0,
    });

    // Fill a grid pattern across multiple chunks
    // This ensures all positions are attempted without gaps
    const targetCount = Math.min(count, MAX_VOXELS);
    const chunkCount = Math.ceil(Math.sqrt(targetCount / 256)); // ~16 voxels per chunk side

    for (let cx = 0; cx < chunkCount && placed < targetCount; cx++) {
      for (let cy = 0; cy < chunkCount && placed < targetCount; cy++) {
        for (let cz = 0; cz < chunkCount && placed < targetCount; cz++) {
          const chunk = get().getOrCreateChunk(cx, cy, cz);

          // Fill this chunk with voxels in a grid pattern
          for (let lx = 0; lx < chunkSize && placed < targetCount; lx++) {
            for (let ly = 0; ly < chunkSize && placed < targetCount; ly++) {
              for (let lz = 0; lz < chunkSize && placed < targetCount; lz++) {
                const key = voxelKey(lx, ly, lz);

                if (!chunk.voxels.has(key)) {
                  const materialId = placed % 5; // Cycle through 5 materials
                  chunk.voxels.set(key, { materialId });
                  placed++;
                }
              }
            }
          }

          chunk.dirty = true;
        }
      }
    }

    console.timeEnd(`Stress Test - Placing ${count} voxels`);
    console.log(`✓ Stress test complete: placed ${placed} voxels across ${get().scene.chunks.size} chunks`);

    set({
      voxelCount: placed,
      sceneVersion: get().sceneVersion + 1,
    });
  },

  setPlaneMode: (mode) => set({ planeMode: mode }),
  setPlanePosition: (position) => set({ planePosition: position }),
  movePlane: (direction) => {
    set({ planePosition: get().planePosition + direction });
  },
}));
