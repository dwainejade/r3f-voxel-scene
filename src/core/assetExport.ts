/**
 * Asset Export/Import Utilities
 * Handles saving and loading custom assets to/from JSON files
 */

import type { Asset } from './assets';
import type { Scene } from './types';

export interface ExportedVoxel {
  x: number;
  y: number;
  z: number;
  material: string;
}

export interface ExportedAsset {
  version: 1;
  asset: {
    id: string;
    name: string;
    category: 'furniture' | 'decoration' | 'structure' | 'plant' | 'other';
    description: string;
    bounds: {
      width: number;
      height: number;
      depth: number;
    };
    voxels: ExportedVoxel[];
    createdAt: string;
  };
}

/**
 * Generate a unique asset ID
 */
export function generateAssetId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate bounds from voxel positions
 */
export function calculateBounds(voxels: ExportedVoxel[]): { width: number; height: number; depth: number } {
  if (voxels.length === 0) {
    return { width: 1, height: 1, depth: 1 };
  }

  let minX = voxels[0].x;
  let maxX = voxels[0].x;
  let minY = voxels[0].y;
  let maxY = voxels[0].y;
  let minZ = voxels[0].z;
  let maxZ = voxels[0].z;

  for (const voxel of voxels) {
    minX = Math.min(minX, voxel.x);
    maxX = Math.max(maxX, voxel.x);
    minY = Math.min(minY, voxel.y);
    maxY = Math.max(maxY, voxel.y);
    minZ = Math.min(minZ, voxel.z);
    maxZ = Math.max(maxZ, voxel.z);
  }

  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    depth: maxZ - minZ + 1,
  };
}

/**
 * Normalize voxels so they start at (0, 0, 0)
 */
function normalizeVoxels(voxels: ExportedVoxel[]): ExportedVoxel[] {
  if (voxels.length === 0) return [];

  let minX = voxels[0].x;
  let minY = voxels[0].y;
  let minZ = voxels[0].z;

  for (const voxel of voxels) {
    minX = Math.min(minX, voxel.x);
    minY = Math.min(minY, voxel.y);
    minZ = Math.min(minZ, voxel.z);
  }

  return voxels.map((v) => ({
    ...v,
    x: v.x - minX,
    y: v.y - minY,
    z: v.z - minZ,
  }));
}

/**
 * Extract voxels from a scene/temporary voxel data
 */
export function extractVoxelsFromScene(scene: Scene, chunkSize: number): ExportedVoxel[] {
  const voxels: ExportedVoxel[] = [];

  for (const chunk of scene.chunks.values()) {
    for (const [key, voxelData] of chunk.voxels) {
      // Parse key string format "x:y:z"
      const [lxStr, lyStr, lzStr] = key.split(':');
      const localX = parseInt(lxStr, 10);
      const localY = parseInt(lyStr, 10);
      const localZ = parseInt(lzStr, 10);

      const worldX = chunk.x * chunkSize + localX;
      const worldY = chunk.y * chunkSize + localY;
      const worldZ = chunk.z * chunkSize + localZ;

      voxels.push({
        x: worldX,
        y: worldY,
        z: worldZ,
        material: voxelData.materialId,
      });
    }
  }

  // Normalize so first voxel is at origin
  return normalizeVoxels(voxels);
}

/**
 * Create an asset definition from exported data
 */
export function createAssetFromExport(exported: ExportedAsset): Asset {
  const voxels = exported.asset.voxels;
  const bounds = exported.asset.bounds;

  return {
    id: exported.asset.id,
    name: exported.asset.name,
    description: exported.asset.description,
    category: exported.asset.category,
    bounds,
    builder: (api, baseX, baseY, baseZ) => {
      for (const voxel of voxels) {
        api.setVoxel(baseX + voxel.x, baseY + voxel.y, baseZ + voxel.z, voxel.material);
      }
    },
  };
}

/**
 * Export an asset to a downloadable JSON file
 */
export function exportAssetToFile(
  name: string,
  category: 'furniture' | 'decoration' | 'structure' | 'plant' | 'other',
  description: string,
  voxels: ExportedVoxel[]
): void {
  const bounds = calculateBounds(voxels);
  const assetId = generateAssetId();

  const exported: ExportedAsset = {
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

  const json = JSON.stringify(exported, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import an asset from a JSON file
 */
export async function importAssetFromFile(file: File): Promise<Asset | null> {
  try {
    const text = await file.text();
    const exported: ExportedAsset = JSON.parse(text);

    // Validate exported asset structure
    if (!exported.version || !exported.asset) {
      console.error('Invalid asset file format');
      return null;
    }

    return createAssetFromExport(exported);
  } catch (error) {
    console.error('Error importing asset:', error);
    return null;
  }
}

/**
 * Create a builder function that captures voxels from placement
 */
export function createAssetBuilder(voxels: ExportedVoxel[]) {
  return (api: any, baseX: number, baseY: number, baseZ: number) => {
    for (const voxel of voxels) {
      api.setVoxel(baseX + voxel.x, baseY + voxel.y, baseZ + voxel.z, voxel.material);
    }
  };
}
