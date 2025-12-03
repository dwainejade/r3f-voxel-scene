import { create } from "zustand";
import type { Chunk, VoxelData, Scene, Light, LightType } from "../core/types";
import type { AssetLibrary } from "../core/assets";
import { worldToChunk, chunkKey, voxelKey } from "../core/utils";
import { buildExampleScene, buildCozyRoom } from "../core/sceneBuilder";
import { getAllMaterials } from "../core/materials";
import { createDefaultAssetLibrary, registerAsset } from "../core/assets";
import { generateAssetId, calculateBounds, extractVoxelsFromScene, createAssetFromExport } from "../core/assetExport";
import { loadAssetsFromLibrary } from "../core/assetLoader";
import { rotateVoxels } from "../core/rotationUtils";
import type { ExportedVoxel } from "../core/assetExport";

const MAX_VOXELS = 1000000; // 1 million voxels for stress testing
const GRID_SIZE = 100; // 10x10x10 grid

type PlaneMode = "x" | "y" | "z";
type PlacementMode = "plane" | "free";
type VoxelMode = "select" | "add" | "remove";
type AppMode = "voxel-editing" | "asset-creation";

export type AssetCategory = 'furniture' | 'decoration' | 'structure' | 'plant' | 'other';

interface VoxelStore {
  scene: Scene;
  gridSize: number;
  editMode: boolean;
  selectedVoxel: [number, number, number] | null;
  hoveredVoxel: [number, number, number] | null;
  currentMaterial: string;
  sceneVersion: number;
  voxelCount: number;
  planeMode: PlaneMode;
  planePosition: number;
  placementMode: PlacementMode;
  voxelMode: VoxelMode;
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
  placedAssets: Map<string, { assetId: string; position: [number, number, number]; rotation: number }>;
  selectedAsset: string | null;
  getAssetAtVoxel: (x: number, y: number, z: number) => string | null;
  getAssetVoxels: (assetInstanceId: string) => Array<[number, number, number]>;

  // Asset Creation Mode
  appMode: AppMode;
  assetCreationState: {
    isCreating: boolean;
    assetName: string;
    assetCategory: AssetCategory;
    assetDescription: string;
    creationScene: Scene; // Separate scene for asset creation
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

  // Actions - Selection
  setSelectedVoxel: (pos: [number, number, number] | null) => void;
  setHoveredVoxel: (pos: [number, number, number] | null) => void;
  setSelectedAsset: (assetInstanceId: string | null) => void;

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
  setVoxelMode: (mode: VoxelMode) => void;
  setPreviewVoxel: (pos: [number, number, number] | null) => void;

  // Actions - Light Management
  addLight: (type: LightType, position: [number, number, number]) => void;
  removeLight: (id: string) => void;
  updateLight: (id: string, updates: Partial<Light>) => void;
  selectLight: (id: string | null) => void;

  // Actions - Asset Management
  placeAsset: (assetId: string, x: number, y: number, z: number, rotation?: number) => void;
  startAssetPreview: (assetId: string) => void;
  updateAssetPreviewPosition: (x: number, y: number, z: number) => void;
  rotateAssetPreview: (direction: 1 | -1) => void;
  adjustAssetHeight: (direction: 1 | -1) => void;
  cancelAssetPreview: () => void;
  confirmAssetPreview: () => void;
  checkAssetCollision: (assetId: string, x: number, y: number, z: number) => boolean;

  // Actions - App Mode Switching
  setAppMode: (mode: AppMode) => void;

  // Actions - Asset Creation
  startAssetCreation: (name: string, category: AssetCategory) => void;
  updateAssetCreationInfo: (name: string, category: AssetCategory, description: string) => void;
  cancelAssetCreation: () => void;
  saveAssetToLibrary: (name: string, category: AssetCategory, description: string) => void;
  getAssetCreationVoxels: () => ExportedVoxel[];

  // Actions - Asset Library Loading
  loadAssetLibrary: () => Promise<void>;
}

export const useVoxelStore = create<VoxelStore>((set, get) => ({
  scene: { chunks: new Map(), chunkSize: 16 },
  gridSize: GRID_SIZE,
  editMode: true,
  selectedVoxel: null,
  hoveredVoxel: null,
  currentMaterial: 'white',
  sceneVersion: 0,
  voxelCount: 0,
  planeMode: "y",
  planePosition: 0,
  placementMode: "plane",
  voxelMode: "select",
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
  placedAssets: new Map(),
  selectedAsset: null,
  appMode: "voxel-editing",
  assetCreationState: {
    isCreating: false,
    assetName: "",
    assetCategory: "furniture",
    assetDescription: "",
    creationScene: { chunks: new Map(), chunkSize: 16 },
  },

  getAssetAtVoxel: (x, y, z) => {
    const state = get();
    // Check all placed assets to see if this voxel belongs to one
    for (const [assetInstanceId, asset] of state.placedAssets) {
      const assetDef = state.assetLibrary.assets.get(asset.assetId);
      if (!assetDef) continue;

      const { width, height, depth } = assetDef.bounds;
      const posX = asset.position[0];
      const posY = asset.position[1];
      const posZ = asset.position[2];

      // Check if voxel is within asset bounds
      if (
        x >= posX && x < posX + width &&
        y >= posY && y < posY + height &&
        z >= posZ && z < posZ + depth
      ) {
        return assetInstanceId;
      }
    }
    return null;
  },

  getAssetVoxels: (assetInstanceId) => {
    const state = get();
    const asset = state.placedAssets.get(assetInstanceId);
    if (!asset) return [];

    const assetDef = state.assetLibrary.assets.get(asset.assetId);
    if (!assetDef) return [];

    const voxels: Array<[number, number, number]> = [];
    const baseX = asset.position[0];
    const baseY = asset.position[1];
    const baseZ = asset.position[2];

    // Capture voxels from asset builder
    const captureAPI = {
      setVoxel: (x: number, y: number, z: number) => {
        voxels.push([baseX + x, baseY + y, baseZ + z]);
      },
    };

    try {
      assetDef.builder(captureAPI, 0, 0, 0);
    } catch (e) {
      console.error('Error building asset voxels:', e);
    }

    return voxels;
  },

  setVoxel: (x, y, z, voxel) => {
    const state = get();
    const gridSize = state.gridSize;
    const half = Math.floor(gridSize / 2);

    // Clamp coordinates to grid bounds
    const clampedX = Math.max(-half, Math.min(half, Math.round(x)));
    const clampedY = Math.max(-half, Math.min(half, Math.round(y)));
    const clampedZ = Math.max(-half, Math.min(half, Math.round(z)));

    // Determine which scene to use
    const targetScene = state.appMode === 'asset-creation' ? state.assetCreationState.creationScene : state.scene;
    const chunkSize = targetScene.chunkSize;

    // Check if voxel already exists
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      clampedX,
      clampedY,
      clampedZ,
      chunkSize
    );

    const key = voxelKey(localX, localY, localZ);
    const existingChunk = targetScene.chunks.get(chunkKey(chunkX, chunkY, chunkZ));
    if (existingChunk && existingChunk.voxels.has(key)) {
      return;
    }

    // Check limit
    if (state.voxelCount >= MAX_VOXELS) {
      return;
    }

    // Get or create chunk
    let chunk = targetScene.chunks.get(chunkKey(chunkX, chunkY, chunkZ));
    if (!chunk) {
      chunk = {
        x: chunkX,
        y: chunkY,
        z: chunkZ,
        voxels: new Map(),
        dirty: true,
      };
      targetScene.chunks.set(chunkKey(chunkX, chunkY, chunkZ), chunk);
    }

    chunk.voxels.set(key, voxel);
    chunk.dirty = true;

    set({
      voxelCount: state.voxelCount + 1,
      sceneVersion: state.sceneVersion + 1,
    });
  },

  removeVoxel: (x, y, z) => {
    const state = get();

    // Determine which scene to use
    const targetScene = state.appMode === 'asset-creation' ? state.assetCreationState.creationScene : state.scene;
    const chunkSize = targetScene.chunkSize;

    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      x,
      y,
      z,
      chunkSize
    );

    const chunk = targetScene.chunks.get(chunkKey(chunkX, chunkY, chunkZ));
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
    const state = get();
    const targetScene = state.appMode === 'asset-creation' ? state.assetCreationState.creationScene : state.scene;
    const chunkSize = targetScene.chunkSize;

    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      x,
      y,
      z,
      chunkSize
    );

    const chunk = targetScene.chunks.get(chunkKey(chunkX, chunkY, chunkZ));
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
  setSelectedVoxel: (pos) => set({ selectedVoxel: pos }),
  setHoveredVoxel: (pos) => set({ hoveredVoxel: pos }),
  setSelectedAsset: (assetInstanceId) => set({ selectedAsset: assetInstanceId }),
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
  setVoxelMode: (mode) => set({ voxelMode: mode }),
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

  placeAsset: (assetId, x, y, z, rotation = 0) => {
    const state = get();
    const asset = state.assetLibrary.assets.get(assetId);
    if (!asset) return;

    // Create a unique instance ID for this placed asset
    const instanceId = `${assetId}-${Date.now()}-${Math.random()}`;

    // Capture voxels from the asset builder
    const voxels: Array<[number, number, number, string]> = [];
    const captureAPI = {
      setVoxel: (ox: number, oy: number, oz: number, materialId: string) => {
        voxels.push([ox, oy, oz, materialId]);
      },
    };

    asset.builder(captureAPI, 0, 0, 0);

    // Apply rotation to voxel coordinates
    const rotatedVoxels = rotation !== 0 ? rotateVoxels(voxels.map(v => [v[0], v[1], v[2]]), rotation) : voxels.map(v => [v[0], v[1], v[2]]);

    // Place rotated voxels into the scene
    rotatedVoxels.forEach((rotatedPos, idx) => {
      const [ox, oy, oz] = rotatedPos;
      const materialId = voxels[idx][3];
      state.setVoxel(x + ox, y + oy, z + oz, { materialId });
    });

    // Register the placed asset instance
    const newPlacedAssets = new Map(state.placedAssets);
    newPlacedAssets.set(instanceId, {
      assetId,
      position: [x, y, z],
      rotation,
    });

    set({ placedAssets: newPlacedAssets });
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
    state.placeAsset(state.assetPreview.assetId, x, y, z, state.assetPreview.rotation);

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
    const rotation = state.assetPreview.rotation;

    // Get rotated bounds
    const [rotatedWidth, rotatedDepth] = rotation === 90 || rotation === 270 ? [depth, width] : [width, depth];

    // Check all voxels that would be occupied by this asset
    for (let ox = 0; ox < rotatedWidth; ox++) {
      for (let oy = 0; oy < height; oy++) {
        for (let oz = 0; oz < rotatedDepth; oz++) {
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

  // Asset Creation Mode Actions
  setAppMode: (mode) => {
    const state = get();

    if (mode === "asset-creation") {
      // Switch to asset creation mode - clear the creation scene
      set({
        appMode: mode,
        assetCreationState: {
          isCreating: true,
          assetName: "",
          assetCategory: "furniture",
          assetDescription: "",
          creationScene: { chunks: new Map(), chunkSize: 16 },
        },
      });
    } else {
      // Switch back to voxel editing mode
      set({
        appMode: mode,
        assetCreationState: {
          ...state.assetCreationState,
          isCreating: false,
        },
      });
    }
  },

  startAssetCreation: (name, category) => {
    set((state) => ({
      assetCreationState: {
        ...state.assetCreationState,
        isCreating: true,
        assetName: name,
        assetCategory: category,
      },
    }));
  },

  updateAssetCreationInfo: (name, category, description) => {
    set((state) => ({
      assetCreationState: {
        ...state.assetCreationState,
        assetName: name,
        assetCategory: category,
        assetDescription: description,
      },
    }));
  },

  cancelAssetCreation: () => {
    set({
      appMode: "voxel-editing",
      assetCreationState: {
        isCreating: false,
        assetName: "",
        assetCategory: "furniture",
        assetDescription: "",
        creationScene: { chunks: new Map(), chunkSize: 16 },
      },
    });
  },

  saveAssetToLibrary: (name, category, description) => {
    const state = get();

    // Extract voxels from creation scene
    const voxels = extractVoxelsFromScene(state.assetCreationState.creationScene, 16);

    if (voxels.length === 0) {
      console.warn('Cannot save asset with no voxels');
      return;
    }

    // Create exported asset format
    const bounds = calculateBounds(voxels);
    const assetId = generateAssetId();

    const exported = {
      version: 1 as const,
      asset: {
        id: assetId,
        name,
        category,
        description,
        bounds,
        voxels,
        createdAt: new Date().toISOString(),
      },
    };

    // Convert to Asset and add to library
    const asset = createAssetFromExport(exported);
    registerAsset(state.assetLibrary, asset);

    // Reset creation state
    set({
      assetCreationState: {
        isCreating: false,
        assetName: "",
        assetCategory: "furniture",
        assetDescription: "",
        creationScene: { chunks: new Map(), chunkSize: 16 },
      },
    });
  },

  getAssetCreationVoxels: () => {
    const state = get();
    return extractVoxelsFromScene(state.assetCreationState.creationScene, 16);
  },

  loadAssetLibrary: async () => {
    const state = get();
    await loadAssetsFromLibrary(state.assetLibrary);
  },
}));
