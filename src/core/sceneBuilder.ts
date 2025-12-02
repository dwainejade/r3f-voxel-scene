export interface SceneBuilderAPI {
  setVoxel: (x: number, y: number, z: number, materialId: number) => void;
}

/**
 * Builds a filled rectangular structure
 */
export function buildBox(
  api: SceneBuilderAPI,
  startX: number,
  startY: number,
  startZ: number,
  width: number,
  height: number,
  depth: number,
  materialId: number
) {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < depth; z++) {
        api.setVoxel(startX + x, startY + y, startZ + z, materialId);
      }
    }
  }
}

/**
 * Builds a hollow box (only walls)
 */
export function buildHollowBox(
  api: SceneBuilderAPI,
  startX: number,
  startY: number,
  startZ: number,
  width: number,
  height: number,
  depth: number,
  materialId: number
) {
  // Bottom and top
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      api.setVoxel(startX + x, startY, startZ + z, materialId); // Bottom
      api.setVoxel(startX + x, startY + height - 1, startZ + z, materialId); // Top
    }
  }

  // Front and back
  for (let x = 0; x < width; x++) {
    for (let y = 1; y < height - 1; y++) {
      api.setVoxel(startX + x, startY + y, startZ, materialId); // Front
      api.setVoxel(startX + x, startY + y, startZ + depth - 1, materialId); // Back
    }
  }

  // Left and right
  for (let z = 1; z < depth - 1; z++) {
    for (let y = 1; y < height - 1; y++) {
      api.setVoxel(startX, startY + y, startZ + z, materialId); // Left
      api.setVoxel(startX + width - 1, startY + y, startZ + z, materialId); // Right
    }
  }
}

/**
 * Builds a pyramid/roof structure
 */
export function buildRoof(
  api: SceneBuilderAPI,
  startX: number,
  startY: number,
  startZ: number,
  width: number,
  depth: number,
  height: number,
  materialId: number
) {
  for (let h = 0; h < height; h++) {
    const currentY = startY + h;
    const offset = Math.floor(h / 2);

    for (let x = offset; x < width - offset; x++) {
      for (let z = offset; z < depth - offset; z++) {
        api.setVoxel(startX + x, currentY, startZ + z, materialId);
      }
    }
  }
}

/**
 * Builds the example dock/port scene
 */
export function buildExampleScene(api: SceneBuilderAPI) {
  // Ground/Terrain
  // Green grass area
  buildBox(api, -15, -5, -15, 30, 5, 30, 1); // Green material (1)

  // Sand/beach area
  buildBox(api, -8, -4, 5, 16, 4, 10, 3); // Yellow material (3)

  // Water
  buildBox(api, -8, -6, 16, 16, 2, 10, 2); // Blue material (2)

  // Building structure
  // Walls (brown/orange - material 0)
  buildBox(api, -6, -2, -10, 8, 4, 6, 0);

  // Roof (orange/red)
  buildRoof(api, -6, 2, -10, 8, 6, 2, 0);

  // Building entrance (empty space)
  for (let x = -4; x < -2; x++) {
    for (let z = -10; z < -8; z++) {
      for (let y = -1; y < 1; y++) {
        // Remove voxels to create entrance
      }
    }
  }

  // Dock/Pier support posts
  buildBox(api, -10, -3, 8, 1, 4, 1, 0); // Post 1
  buildBox(api, -2, -3, 8, 1, 4, 1, 0); // Post 2
  buildBox(api, 6, -3, 8, 1, 4, 1, 0); // Post 3

  // Dock platform
  buildBox(api, -12, 2, 7, 20, 1, 4, 4); // Purple material (4)

  // Small boat structure (simplified)
  // Boat hull
  buildBox(api, 2, -1, 10, 8, 2, 4, 0); // Brown/orange hull
  // Boat cabin
  buildBox(api, 4, 1, 11, 4, 2, 2, 0); // Brown/orange cabin

  // Bridge/railing on dock
  buildBox(api, -12, 3, 9, 20, 1, 1, 4); // Purple railings
  buildBox(api, -12, 3, 10, 20, 1, 1, 4); // Purple railings

  // Small storage boxes
  buildBox(api, -10, 2, 2, 2, 2, 2, 3); // Yellow box
  buildBox(api, -6, 2, 2, 2, 2, 2, 3); // Yellow box
  buildBox(api, 10, 2, 2, 2, 2, 2, 3); // Yellow box
}
