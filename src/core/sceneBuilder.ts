export interface SceneBuilderAPI {
  setVoxel: (x: number, y: number, z: number, materialId: string) => void;
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
  materialId: string
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
  materialId: string
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
  materialId: string
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
  // Grass area
  buildBox(api, -15, -5, -15, 30, 5, 30, 'grass');

  // Sand/beach area
  buildBox(api, -8, -4, 5, 16, 4, 10, 'sand');

  // Water
  buildBox(api, -8, -6, 16, 16, 2, 10, 'neonBlue');

  // Building structure
  // Walls (brick/wood)
  buildBox(api, -6, -2, -10, 8, 4, 6, 'walnut');

  // Roof (bronze)
  buildRoof(api, -6, 2, -10, 8, 6, 2, 'bronze');

  // Building entrance (empty space)
  for (let x = -4; x < -2; x++) {
    for (let z = -10; z < -8; z++) {
      for (let y = -1; y < 1; y++) {
        // Remove voxels to create entrance
      }
    }
  }

  // Dock/Pier support posts
  buildBox(api, -10, -3, 8, 1, 4, 1, 'iron'); // Post 1
  buildBox(api, -2, -3, 8, 1, 4, 1, 'iron'); // Post 2
  buildBox(api, 6, -3, 8, 1, 4, 1, 'iron'); // Post 3

  // Dock platform
  buildBox(api, -12, 2, 7, 20, 1, 4, 'gold'); // Gold deck

  // Small boat structure (simplified)
  // Boat hull
  buildBox(api, 2, -1, 10, 8, 2, 4, 'walnut'); // Wood hull
  // Boat cabin
  buildBox(api, 4, 1, 11, 4, 2, 2, 'oak'); // Oak cabin

  // Bridge/railing on dock
  buildBox(api, -12, 3, 9, 20, 1, 1, 'copper'); // Copper railings
  buildBox(api, -12, 3, 10, 20, 1, 1, 'copper'); // Copper railings

  // Small storage boxes
  buildBox(api, -10, 2, 2, 2, 2, 2, 'vibrantRed'); // Red box
  buildBox(api, -6, 2, 2, 2, 2, 2, 'vibrantGreen'); // Green box
  buildBox(api, 10, 2, 2, 2, 2, 2, 'vibrantYellow'); // Yellow box
}

/**
 * Builds a cozy room scene with furniture and warm aesthetics
 */
export function buildCozyRoom(api: SceneBuilderAPI) {
  // Floor (pink base) - 30x30
  buildBox(api, -15, -3, -15, 30, 1, 30, 'vibrantOrange');

  // Back wall (white) - 20 high
  buildBox(api, -15, -2, -15, 30, 20, 1, 'white');

  // Left wall (cyan/turquoise) - 20 high
  buildBox(api, -15, -2, -15, 1, 20, 30, 'vibrantCyan');
}
