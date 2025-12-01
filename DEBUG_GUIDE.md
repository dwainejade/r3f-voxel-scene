# Voxel Placement Debug Guide

## Current Status
The plane-based voxel placement system has been implemented with grid clamping. The code is ready to test, but browser cache may be showing old console logs.

## Immediate Action Required

### 1. Clear Browser Cache and Hard Refresh
Your browser may be showing cached code. Do a hard refresh to clear the cache:

**On macOS:**
```
Cmd + Shift + R
```

**On Windows/Linux:**
```
Ctrl + Shift + F5
```

### 2. Verify New Code is Running
After hard refresh, open DevTools (F12 or Cmd+Option+I) and click once to place a voxel.

You should see these NEW console logs (NOT the old ones):

```
=== CLICK HANDLER ===
planeMode: "y", planePosition: 0
ray direction: (x.xxx, y.yyy, z.zzz)
Y Plane click: t=X.XX, calculated (x, y, z)
setVoxel: requested (x, y, z) -> clamped (x, y, z)
Placed voxel at (x, y, z) in chunk (cx, cy, cz)
```

If you still see OLD logs like:
- "Voxel set at world (0,0,0)"
- "Chunk now has X voxels"
- "No hit - placing voxel at origin"

Then the browser cache is still active. Try:
- Close the browser tab completely and reopen
- Use Incognito/Private mode to bypass cache completely
- Check that dev server is running (should see Vite in terminal)

## Understanding the Plane Intersection System

### How It Works
1. **Select Plane Mode**: Choose X, Y, or Z from the UI buttons
2. **Set Plane Position**: Use slider or +/- buttons (-50 to 50 range)
3. **Click to Place**: Left-click calculates ray-plane intersection
4. **Automatic Clamping**: Coordinates snap to 10x10x10 grid (-5 to 5 in each axis)

### Ray-Plane Intersection Math
The system uses parametric ray equation to find where the camera's ray intersects with a plane:

```
Ray: P(t) = camera.position + t * ray.direction
Plane: x = c (or y = c, or z = c)

Solving for t:
- For Y plane: t = (planePosition - camera.y) / ray.direction.y
- For X plane: t = (planePosition - camera.x) / ray.direction.x
- For Z plane: t = (planePosition - camera.z) / ray.direction.z
```

### Grid Bounds
- Grid size: 10x10x10
- World bounds: -5 to 5 (in each axis)
- Any voxel placed outside these bounds is clamped to the edge

## Test Plan

### Test 1: Y Plane Placement
1. Ensure Y plane button is selected (should be default)
2. Plane position slider should be at 0
3. Click in center of canvas → voxel should appear at (0, 0, 0) initially
4. Click in top-left → voxel at (negative_x, 0, positive_z)
5. Click in bottom-right → voxel at (positive_x, 0, negative_z)

**Expected Logs:**
```
Y Plane click: t=X.XX, calculated (-3, 0, 4)
setVoxel: requested (-3, 0, 4) -> clamped (-3, 0, 4)
```

### Test 2: Plane Position Adjustment
1. Select Y plane
2. Move slider to position 10 (up)
3. Click center → should place voxel at (0, 10, 0) - but CLAMPED to (0, 5, 0) since grid max is 5
4. Move slider to position -10 (down)
5. Click center → should place voxel at (0, -10, 0) - but CLAMPED to (0, -5, 0)

**Expected Clamping Log:**
```
setVoxel: requested (0, 10, 0) -> clamped (0, 5, 0)
```

### Test 3: X and Z Planes
1. Select X plane, move slider, click several points
2. Select Z plane, move slider, click several points
3. Verify voxels appear at different coordinates for each plane mode

### Test 4: Grid Bounds
1. Move slider to maximum (50)
2. Click around the corners
3. All voxels should stay within (-5 to 5) range in clamped logs

## Troubleshooting

### Issue: Still seeing old console logs
**Solution:**
- Close browser completely (not just tab)
- Open new tab to localhost:5173
- Hard refresh with Cmd+Shift+R
- Try Incognito mode to completely bypass cache

### Issue: "ray is parallel to plane" message appears
**Cause:** Ray is moving parallel to the plane (usually camera is moving directly along the plane)
**Solution:** Move camera angle using Orbit Controls, or move plane position

### Issue: Voxels appearing at (0,0,0) even after clicking elsewhere
**Possible Cause 1:** Old code still cached in browser (see above)
**Possible Cause 2:** `planeMode` or `planePosition` not updating in store
**Debug:** Check if UI buttons show "active" state when clicked. If not, store isn't updating.

### Issue: Voxels not clamped within bounds
**Debug:** Look for "setVoxel: requested ... -> clamped ..." log
- If requested and clamped are different, clamping is working
- If they're the same, check if coordinates were already within bounds

## Console Log Reference

### On successful voxel placement:
```
=== CLICK HANDLER ===                           // Line 47
planeMode: "y", planePosition: 0                // Line 48
ray direction: (0.123, -0.456, 0.789)          // Line 61
Y Plane click: t=15.23, calculated (-2, 0, 3)  // Line 74
setVoxel: requested (-2, 0, 3) -> clamped (-2, 0, 3)  // Line 67 in voxelStore
Placed voxel at (-2, 0, 3) in chunk (-1, 0, 0) // Line 91
```

### On parallel ray (error case):
```
Y plane: ray is parallel to plane              // Line 67
// (no voxel placed, function returns early)
```

### On clamping adjustment:
```
setVoxel: requested (15, 0, 20) -> clamped (5, 0, 5)  // Hits grid boundary
```

## Files Modified
- `src/components/VoxelEditor.tsx` - Plane intersection calculations and click handling
- `src/store/voxelStore.ts` - Grid size variable and voxel clamping logic
- `src/components/PlaneGuide.tsx` - Visual plane renderer
- `src/App.tsx` - Plane mode controls UI
- `src/App.css` - Plane control styling

## Next Steps (After Verification)
Once the plane-based placement is working reliably:
1. Remove debug console.logs to clean up output
2. Fine-tune grid size if needed (currently hardcoded to 10)
3. Add keyboard shortcuts for plane switching (X, Y, Z keys)
4. Add undo/redo functionality
