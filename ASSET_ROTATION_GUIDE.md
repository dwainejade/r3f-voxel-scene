# Asset Rotation & Placement System

This guide explains how the asset rotation and placement system works.

## How Assets Are Placed

When you place an asset, the system:

1. **Captures voxel data** from the asset's builder function
2. **Applies rotation** to the voxel coordinates based on the preview rotation
3. **Places the rotated voxels** into the scene at the target position
4. **Records the instance** with position and rotation for future reference

## Rotation System

Assets can be rotated in 90-degree increments (0°, 90°, 180°, 270°).

### How Rotation Works

When an asset is rotated, the voxel coordinates are transformed:

- **0°** - No rotation
- **90°** - Clockwise rotation (x,z) → (z,-x)
- **180°** - Opposite rotation (x,z) → (-x,-z)
- **270°** - Counter-clockwise rotation (x,z) → (-z,x)

The Y coordinate (height) is never affected by rotation.

### Bounds Transform

When an asset rotates by 90° or 270°, its width and depth swap:

```
Original:  3×4 (width × depth)
90° rotate: 4×3 (width × depth are swapped)
```

## Placement Workflow

### In Asset Browser

1. Click an asset to start placement preview
2. Use **Q/E** keys to rotate (or click rotation buttons)
3. Use **↑/↓** arrows to adjust height
4. Move mouse to position
5. Press **Enter** (or click ✓) to confirm
6. Press **Esc** to cancel

### Collision Detection

The system checks for collisions using rotated bounds:

- Checks both the preview and actual placement
- Updates collision status in real-time as you rotate/move
- Shows green box if placement is valid, red if there's a collision

## Technical Details

### Asset Instance Tracking

Each placed asset is tracked with:

```typescript
{
  assetId: string,        // Reference to the asset definition
  position: [x, y, z],    // Base position in world space
  rotation: number        // Rotation in degrees (0, 90, 180, 270)
}
```

### Voxel Coordinate Transformation

The rotation is applied at placement time:

1. Asset builder outputs relative voxel coordinates
2. Rotation utility transforms coordinates based on rotation angle
3. Coordinates are normalized so all values are non-negative
4. Final coordinates are offset by the placement position

### Collision Checking

When placing an asset:

```javascript
// Get rotated bounds
const [rotatedWidth, rotatedDepth] =
  rotation === 90 || rotation === 270 ? [depth, width] : [width, depth];

// Check all voxels in the rotated bounds
for (let ox = 0; ox < rotatedWidth; ox++) {
  for (let oy = 0; oy < height; oy++) {
    for (let oz = 0; oz < rotatedDepth; oz++) {
      if (voxel exists at [x+ox, y+oy, z+oz]) {
        collision detected ❌
      }
    }
  }
}
```

## Asset File Format

Exported assets store voxel positions in their local coordinate system (relative to origin):

```json
{
  "voxels": [
    {"x": 0, "y": 0, "z": 0, "material": "walnut"},
    {"x": 1, "y": 0, "z": 0, "material": "walnut"}
  ]
}
```

These coordinates are:
- Independent of rotation (stored unrotated)
- Rotated at placement time
- Never stored with rotation applied

## Performance Notes

- Rotation calculations are done at placement time only
- Collision checks use bounding box approach (efficient)
- Rotated assets are stored as individual voxels (no special grouping)
- Multiple instances of the same asset are fully independent

## Limitations & Notes

- Rotation is limited to 90° increments (no arbitrary angles)
- Rotated asset bounds may differ from original (e.g., 3×4 becomes 4×3)
- Collision detection respects rotated dimensions
- Asset instances cannot be moved/rotated after placement (they're stored as voxels)
