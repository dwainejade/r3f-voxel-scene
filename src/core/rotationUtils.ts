/**
 * Rotation Utilities
 * Handles voxel coordinate rotation for asset placement
 */

/**
 * Rotate a voxel coordinate around the origin
 * Rotation is in 90-degree increments
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param rotation - Rotation in degrees (0, 90, 180, 270)
 * @returns Rotated [x, z] coordinates
 */
export function rotateCoordinate(x: number, z: number, rotation: number): [number, number] {
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  switch (normalizedRotation) {
    case 0:
      return [x, z];
    case 90:
      return [z, -x];
    case 180:
      return [-x, -z];
    case 270:
      return [-z, x];
    default:
      return [x, z];
  }
}

/**
 * Rotate voxel positions for an asset
 * @param voxels - Array of voxel positions
 * @param rotation - Rotation in degrees
 * @returns Array of rotated voxel positions
 */
export function rotateVoxels(voxels: Array<[number, number, number]>, rotation: number): Array<[number, number, number]> {
  const rotated = voxels.map(([x, y, z]) => {
    const [newX, newZ] = rotateCoordinate(x, z, rotation);
    return [newX, y, newZ] as [number, number, number];
  });

  // Normalize coordinates so they're all non-negative
  const minX = Math.min(...rotated.map(v => v[0]));
  const minZ = Math.min(...rotated.map(v => v[2]));

  return rotated.map(([x, y, z]) => [x - minX, y, z - minZ] as [number, number, number]);
}

/**
 * Get the rotated bounds of an asset
 * @param width - Original width
 * @param depth - Original depth
 * @param rotation - Rotation in degrees
 * @returns Rotated [width, depth]
 */
export function getRotatedBounds(width: number, depth: number, rotation: number): [number, number] {
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  if (normalizedRotation === 90 || normalizedRotation === 270) {
    return [depth, width];
  }
  return [width, depth];
}
