import { create } from "zustand";
import type { Chunk, VoxelData, Scene, Light, LightType } from "../core/types";
import type { AssetLibrary } from "../core/assets";
import { worldToChunk, chunkKey, voxelKey } from "../core/utils";
import { buildExampleScene, buildCozyRoom } from "../core/sceneBuilder";
import { getAllMaterials } from "../core/materials";
import { createDefaultAssetLibrary } from "../core/assets";

const MAX_VOXELS = 1000000; // 1 million voxels for stress testing
const GRID_SIZE = 100; // 10x10x10 grid

type PlaneMode = "x" | "y" | "z";
type PlacementMode = "plane" | "free";

interface VoxelStore {
  scene: Scene;
  gridSize: number;
  editMode: boolean;
  selectedVoxel: [number, number, number] | null;
  currentMaterial: string;
  sceneVersion: number;
  voxelCount: number;
  planeMode: PlaneMode;
  planePosition: number;
  placementMode: PlacementMode;
  previewVoxel: [number, number, number] | null;

  // Light management
  lights: Light[];
  selectedLight: string | null;

  // Asset library
  assetLibrary: AssetLibrary;
  assetPreview: {
    assetId: string | null;
    position: [number, number, number];
    rotation: number; // Rotation in degrees (0, 90, 180, 270)
    canPlace: boolean;
  };

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
  setCurrentMaterial: (materialId: string) => void;

  // Actions - Scene Management
  clearScene: () => void;
  stressTest: (count: number) => void;
  buildExampleDockScene: () => void;
  buildCozyRoomScene: () => void;

  // Actions - Plane Mode
  setPlaneMode: (mode: PlaneMode) => void;
  setPlanePosition: (position: number) => void;
  movePlane: (direction: -1 | 1) => void;

  // Actions - Placement Mode
  setPlacementMode: (mode: PlacementMode) => void;
  setPreviewVoxel: (pos: [number, number, number] | null) => void;

  // Actions - Light Management
  addLight: (type: LightType, position: [number, number, number]) => void;
  removeLight: (id: string) => void;
  updateLight: (id: string, updates: Partial<Light>) => void;
  selectLight: (id: string | null) => void;

  // Actions - Asset Management
  placeAsset: (assetId: string, x: number, y: number, z: number) => void;
  startAssetPreview: (assetId: string) => void;
  updateAssetPreviewPosition: (x: number, y: number, z: number) => void;
  rotateAssetPreview: (direction: 1 | -1) => void;
  adjustAssetHeight: (direction: 1 | -1) => void;
  cancelAssetPreview: () => void;
  confirmAssetPreview: () => void;
  checkAssetCollision: (assetId: string, x: number, y: number, z: number) => boolean;
}

export const useVoxelStore = create<VoxelStore>((set, get) => ({
  scene: { chunks: new Map(), chunkSize: 16 },
  gridSize: GRID_SIZE,
  editMode: true,
  selectedVoxel: null,
  currentMaterial: 'white',
  sceneVersion: 0,
  voxelCount: 0,
  planeMode: "y",
  planePosition: 0,
  placementMode: "plane",
  previewVoxel: null,
  lights: [],
  selectedLight: null,
  assetLibrary: createDefaultAssetLibrary(),
  assetPreview: {
    assetId: null,
    position: [0, 0, 0],
    rotation: 0,
    canPlace: false,
  },

  setVoxel: (x, y, z, voxel) => {
    const state = get();
    const gridSize = state.gridSize;
    const half = Math.floor(gridSize / 2);

    // Clamp coordinates to grid bounds
    const clampedX = Math.max(-half, Math.min(half, Math.round(x)));
    const clampedY = Math.max(-half, Math.min(half, Math.round(y)));
    const clampedZ = Math.max(-half, Math.min(half, Math.round(z)));

    // Check if voxel already exists
    const existing = state.getVoxel(clampedX, clampedY, clampedZ);
    if (existing) {
      return;
    }

    // Check limit
    if (state.voxelCount >= MAX_VOXELS) {
      return;
    }

    const { chunkSize } = state.scene;
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      clampedX,
      clampedY,
      clampedZ,
      chunkSize
    );

    const chunk = state.getOrCreateChunk(chunkX, chunkY, chunkZ);
    const key = voxelKey(localX, localY, localZ);
    chunk.voxels.set(key, voxel);
    chunk.dirty = true;

    set({
      voxelCount: state.voxelCount + 1,
      sceneVersion: state.sceneVersion + 1,
    });
  },

  removeVoxel: (x, y, z) => {
    const state = get();
    const { chunkSize } = state.scene;
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      x,
      y,
      z,
      chunkSize
    );

    const chunk = state.getChunk(chunkX, chunkY, chunkZ);
    if (!chunk) return;

    const key = voxelKey(localX, localY, localZ);
    const existed = chunk.voxels.delete(key);
    if (!existed) return;

    chunk.dirty = true;

    set({
      voxelCount: Math.max(0, state.voxelCount - 1),
      sceneVersion: state.sceneVersion + 1,
    });
  },

  getVoxel: (x, y, z) => {
    const { chunkSize } = get().scene;
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      x,
      y,
      z,
      chunkSize
    );

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
    const materials = getAllMaterials();

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
                  const materialId = materials[placed % materials.length].id;
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

  setPlacementMode: (mode) => set({ placementMode: mode }),
  setPreviewVoxel: (pos) => set({ previewVoxel: pos }),

  buildExampleDockScene: () => {
    const state = get();

    // Clear scene first
    set({
      scene: { chunks: new Map(), chunkSize: 16 },
      selectedVoxel: null,
      sceneVersion: 0,
      voxelCount: 0,
    });

    // Build the scene
    let voxelCount = 0;
    const buildAPI = {
      setVoxel: (x: number, y: number, z: number, materialId: string) => {
        const gridSize = state.gridSize;
        const half = Math.floor(gridSize / 2);

        // Clamp coordinates
        const clampedX = Math.max(-half, Math.min(half, Math.round(x)));
        const clampedY = Math.max(-half, Math.min(half, Math.round(y)));
        const clampedZ = Math.max(-half, Math.min(half, Math.round(z)));

        // Check if voxel already exists
        const existing = get().getVoxel(clampedX, clampedY, clampedZ);
        if (existing) return;

        const { chunkSize } = get().scene;
        const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
          clampedX,
          clampedY,
          clampedZ,
          chunkSize
        );

        const chunk = get().getOrCreateChunk(chunkX, chunkY, chunkZ);
        const key = voxelKey(localX, localY, localZ);
        chunk.voxels.set(key, { materialId });
        chunk.dirty = true;
        voxelCount++;
      },
    };

    buildExampleScene(buildAPI);

    set({
      voxelCount,
      sceneVersion: get().sceneVersion + 1,
    });
  },

  buildCozyRoomScene: () => {
    const state = get();

    // Clear scene first
    set({
      scene: { chunks: new Map(), chunkSize: 16 },
      selectedVoxel: null,
      sceneVersion: 0,
      voxelCount: 0,
    });

    // Build the scene
    let voxelCount = 0;
    const buildAPI = {
      setVoxel: (x: number, y: number, z: number, materialId: string) => {
        const gridSize = state.gridSize;
        const half = Math.floor(gridSize / 2);

        // Clamp coordinates
        const clampedX = Math.max(-half, Math.min(half, Math.round(x)));
        const clampedY = Math.max(-half, Math.min(half, Math.round(y)));
        const clampedZ = Math.max(-half, Math.min(half, Math.round(z)));

        // Check if voxel already exists
        const existing = get().getVoxel(clampedX, clampedY, clampedZ);
        if (existing) return;

        const { chunkSize } = get().scene;
        const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
          clampedX,
          clampedY,
          clampedZ,
          chunkSize
        );

        const chunk = get().getOrCreateChunk(chunkX, chunkY, chunkZ);
        const key = voxelKey(localX, localY, localZ);
        chunk.voxels.set(key, { materialId });
        chunk.dirty = true;
        voxelCount++;
      },
    };

    buildCozyRoom(buildAPI);

    set({
      voxelCount,
      sceneVersion: get().sceneVersion + 1,
    });
  },

  addLight: (type, position) => {
    const id = `light-${Date.now()}-${Math.random()}`;
    const newLight: Light = {
      id,
      type,
      position,
      color: '#FFFFFF',
      intensity: type === 'directional' ? 1 : 0.8,
      castShadow: true,
      ...(type === 'point' && { distance: 100 }),
      ...(type === 'spot' && { distance: 100, angle: Math.PI / 6, penumbra: 0.5 }),
      ...(type === 'directional' && { target: [0, 0, 0] }),
    };

    set((state) => ({
      lights: [...state.lights, newLight],
      selectedLight: id,
    }));
  },

  removeLight: (id) => {
    set((state) => ({
      lights: state.lights.filter((light) => light.id !== id),
      selectedLight: state.selectedLight === id ? null : state.selectedLight,
    }));
  },

  updateLight: (id, updates) => {
    set((state) => ({
      lights: state.lights.map((light) =>
        light.id === id ? { ...light, ...updates } : light
      ),
    }));
  },

  selectLight: (id) => {
    set({ selectedLight: id });
  },

  placeAsset: (assetId, x, y, z) => {
    const state = get();
    const asset = state.assetLibrary.assets.get(assetId);
    if (!asset) return;

    const buildAPI = {
      setVoxel: (ox: number, oy: number, oz: number, materialId: string) => {
        state.setVoxel(x + ox, y + oy, z + oz, { materialId });
      },
    };

    asset.builder(buildAPI, 0, 0, 0);
  },

  startAssetPreview: (assetId) => {
    const asset = get().assetLibrary.assets.get(assetId);
    if (!asset) return;

    set({
      assetPreview: {
        assetId,
        position: [0, 0, 0],
        rotation: 0,
        canPlace: true,
      },
    });
  },

  updateAssetPreviewPosition: (x, y, z) => {
    const state = get();
    if (!state.assetPreview.assetId) return;

    const canPlace = !state.checkAssetCollision(state.assetPreview.assetId, x, y, z);

    set({
      assetPreview: {
        ...state.assetPreview,
        position: [x, y, z],
        canPlace,
      },
    });
  },

  cancelAssetPreview: () => {
    set({
      assetPreview: {
        assetId: null,
        position: [0, 0, 0],
        rotation: 0,
        canPlace: false,
      },
    });
  },

  confirmAssetPreview: () => {
    const state = get();
    if (!state.assetPreview.assetId || !state.assetPreview.canPlace) return;

    const [x, y, z] = state.assetPreview.position;
    state.placeAsset(state.assetPreview.assetId, x, y, z);

    set({
      assetPreview: {
        assetId: null,
        position: [0, 0, 0],
        rotation: 0,
        canPlace: false,
      },
    });
  },

  checkAssetCollision: (assetId, x, y, z) => {
    const state = get();
    const asset = state.assetLibrary.assets.get(assetId);
    if (!asset) return true;

    const { width, height, depth } = asset.bounds;

    // Check all voxels that would be occupied by this asset
    for (let ox = 0; ox < width; ox++) {
      for (let oy = 0; oy < height; oy++) {
        for (let oz = 0; oz < depth; oz++) {
          const voxel = state.getVoxel(x + ox, y + oy, z + oz);
          if (voxel) {
            return true; // Collision detected
          }
        }
      }
    }

    return false; // No collision
  },

  rotateAssetPreview: (direction) => {
    const state = get();
    if (!state.assetPreview.assetId) return;

    const newRotation = (state.assetPreview.rotation + direction * 90) % 360;

    set({
      assetPreview: {
        ...state.assetPreview,
        rotation: newRotation,
      },
    });
  },

  adjustAssetHeight: (direction) => {
    const state = get();
    if (!state.assetPreview.assetId) return;

    const [x, y, z] = state.assetPreview.position;
    const newY = y + direction;

    state.updateAssetPreviewPosition(x, newY, z);
  },
}));
