import type { SceneBuilderAPI } from './sceneBuilder';

/**
 * Asset Library System
 * Allows creation and reuse of predefined voxel structures
 */

export interface Asset {
  id: string;
  name: string;
  description: string;
  category: 'furniture' | 'decoration' | 'structure' | 'plant' | 'other';
  builder: (api: SceneBuilderAPI, x: number, y: number, z: number) => void;
  bounds: {
    width: number;  // X dimension
    height: number; // Y dimension
    depth: number;  // Z dimension
  };
}

export interface AssetLibrary {
  assets: Map<string, Asset>;
  categories: Set<string>;
}

/**
 * Asset builder functions
 * Each takes origin coordinates (x, y, z) and uses SceneBuilderAPI
 */

export function createAssetLibrary(): AssetLibrary {
  return {
    assets: new Map(),
    categories: new Set(),
  };
}

export function registerAsset(library: AssetLibrary, asset: Asset): void {
  library.assets.set(asset.id, asset);
  library.categories.add(asset.category);
}

export function getAsset(library: AssetLibrary, assetId: string): Asset | undefined {
  return library.assets.get(assetId);
}

export function getAssetsByCategory(library: AssetLibrary, category: string): Asset[] {
  return Array.from(library.assets.values()).filter((a) => a.category === category);
}

export function getAllAssets(library: AssetLibrary): Asset[] {
  return Array.from(library.assets.values());
}

/**
 * Built-in Asset Definitions
 */

// Simple bed (wooden frame with mattress)
export const bedAsset: Asset = {
  id: 'bed-wooden',
  name: 'Wooden Bed',
  description: 'A simple wooden bed frame with mattress',
  category: 'furniture',
  builder: (api, x, y, z) => {
    // Frame (walnut wood)
    api.setVoxel(x, y, z, 'walnut');
    api.setVoxel(x + 4, y, z, 'walnut');
    api.setVoxel(x, y, z + 2, 'walnut');
    api.setVoxel(x + 4, y, z + 2, 'walnut');

    // Mattress (soft pink)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        api.setVoxel(x + i, y + 1, z + j, 'softPeach');
      }
    }

    // Pillows (soft colors)
    api.setVoxel(x + 1, y + 2, z + 2, 'pastelBlue');
    api.setVoxel(x + 3, y + 2, z + 2, 'pastelPurple');
  },
  bounds: { width: 5, height: 3, depth: 3 },
};

// Simple desk
export const deskAsset: Asset = {
  id: 'desk-wooden',
  name: 'Wooden Desk',
  description: 'A simple wooden desk with drawers',
  category: 'furniture',
  builder: (api, x, y, z) => {
    // Desktop (walnut)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 2; j++) {
        api.setVoxel(x + i, y + 1, z + j, 'walnut');
      }
    }

    // Legs
    api.setVoxel(x, y, z, 'walnut');
    api.setVoxel(x + 4, y, z, 'walnut');
    api.setVoxel(x, y, z + 1, 'walnut');
    api.setVoxel(x + 4, y, z + 1, 'walnut');

    // Drawer fronts (lighter wood)
    api.setVoxel(x + 1, y, z, 'oak');
    api.setVoxel(x + 2, y, z, 'oak');
    api.setVoxel(x + 3, y, z, 'oak');
  },
  bounds: { width: 5, height: 2, depth: 2 },
};

// Small shelf
export const shelfAsset: Asset = {
  id: 'shelf-wooden',
  name: 'Wooden Shelf',
  description: 'A compact wooden shelf for storage',
  category: 'furniture',
  builder: (api, x, y, z) => {
    // Back support (walnut)
    api.setVoxel(x, y, z, 'walnut');
    api.setVoxel(x, y + 1, z, 'walnut');
    api.setVoxel(x, y + 2, z, 'walnut');

    // Shelves (lighter wood)
    for (let i = 0; i < 4; i++) {
      api.setVoxel(x + i, y, z, 'oak');
      api.setVoxel(x + i, y + 1, z, 'oak');
      api.setVoxel(x + i, y + 2, z, 'oak');
    }

    // Side support right
    api.setVoxel(x + 3, y, z, 'walnut');
    api.setVoxel(x + 3, y + 1, z, 'walnut');
    api.setVoxel(x + 3, y + 2, z, 'walnut');
  },
  bounds: { width: 4, height: 3, depth: 1 },
};

// Small potted plant
export const plantAsset: Asset = {
  id: 'plant-small',
  name: 'Potted Plant',
  description: 'A small decorative plant in a pot',
  category: 'plant',
  builder: (api, x, y, z) => {
    // Pot (terracotta color)
    api.setVoxel(x, y, z, 'clay');
    api.setVoxel(x + 1, y, z, 'clay');

    // Soil
    api.setVoxel(x, y + 1, z, 'dirt');
    api.setVoxel(x + 1, y + 1, z, 'dirt');

    // Plant leaves (green)
    api.setVoxel(x, y + 2, z, 'pastelGreen');
    api.setVoxel(x + 1, y + 2, z, 'pastelGreen');
    api.setVoxel(x, y + 3, z, 'vibrantGreen');
  },
  bounds: { width: 2, height: 4, depth: 1 },
};

// Table lamp
export const lampAsset: Asset = {
  id: 'lamp-table',
  name: 'Table Lamp',
  description: 'A decorative table lamp with warm glow',
  category: 'decoration',
  builder: (api, x, y, z) => {
    // Base (dark)
    api.setVoxel(x, y, z, 'charcoal');

    // Pole (metal)
    api.setVoxel(x, y + 1, z, 'gold');
    api.setVoxel(x, y + 2, z, 'gold');

    // Shade (warm white, emissive)
    api.setVoxel(x, y + 3, z, 'cream');
    api.setVoxel(x, y + 4, z, 'softWarmWhite');
  },
  bounds: { width: 1, height: 5, depth: 1 },
};

// Rug/carpet
export const rugAsset: Asset = {
  id: 'rug-small',
  name: 'Small Rug',
  description: 'A cozy floor rug',
  category: 'decoration',
  builder: (api, x, y, z) => {
    // 4x3 rug
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        api.setVoxel(x + i, y, z + j, 'softPeach');
      }
    }
  },
  bounds: { width: 4, height: 1, depth: 3 },
};

// Picture frame
export const pictureFrameAsset: Asset = {
  id: 'frame-picture',
  name: 'Picture Frame',
  description: 'A decorative wall picture frame',
  category: 'decoration',
  builder: (api, x, y, z) => {
    // Frame border (wood)
    api.setVoxel(x, y, z, 'walnut');
    api.setVoxel(x + 2, y, z, 'walnut');
    api.setVoxel(x, y + 2, z, 'walnut');
    api.setVoxel(x + 2, y + 2, z, 'walnut');

    // Frame sides
    api.setVoxel(x + 1, y, z, 'walnut');
    api.setVoxel(x + 1, y + 2, z, 'walnut');
    api.setVoxel(x, y + 1, z, 'walnut');
    api.setVoxel(x + 2, y + 1, z, 'walnut');

    // Center (soft blush color for art)
    api.setVoxel(x + 1, y + 1, z, 'softBlush');
  },
  bounds: { width: 3, height: 3, depth: 1 },
};

// Chair
export const chairAsset: Asset = {
  id: 'chair-simple',
  name: 'Simple Chair',
  description: 'A simple wooden chair',
  category: 'furniture',
  builder: (api, x, y, z) => {
    // Seat (soft color)
    api.setVoxel(x, y + 1, z, 'softPeach');
    api.setVoxel(x + 1, y + 1, z, 'softPeach');

    // Legs
    api.setVoxel(x, y, z, 'walnut');
    api.setVoxel(x + 1, y, z, 'walnut');
    api.setVoxel(x, y, z + 1, 'walnut');
    api.setVoxel(x + 1, y, z + 1, 'walnut');

    // Back (support)
    api.setVoxel(x, y + 2, z, 'walnut');
    api.setVoxel(x + 1, y + 2, z, 'walnut');
  },
  bounds: { width: 2, height: 3, depth: 2 },
};

/**
 * Create and populate default asset library
 */
export function createDefaultAssetLibrary(): AssetLibrary {
  const library = createAssetLibrary();

  registerAsset(library, bedAsset);
  registerAsset(library, deskAsset);
  registerAsset(library, shelfAsset);
  registerAsset(library, plantAsset);
  registerAsset(library, lampAsset);
  registerAsset(library, rugAsset);
  registerAsset(library, pictureFrameAsset);
  registerAsset(library, chairAsset);

  return library;
}
