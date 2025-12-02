# Voxel Scene Maker - Performance-First Architecture Plan

## Overview

This document outlines a comprehensive plan for building a performant voxel scene maker in React Three Fiber (R3F) with a focus on rendering performance, efficient data structures, and scalable architecture.

---

## 1. Rendering Strategy: Hybrid Instanced + Meshed Approach

### Why This Works Best

- **Instancing during edit mode** = instant feedback
- **Greedy meshing for display mode** = optimal performance
- Can handle **100K+ voxels** smoothly

### Core Principle

Separate the data model from the rendering strategy

```
Data Layer (Source of Truth)
    ↓
Rendering Strategy Selector
    ↓
┌─────────────────┬──────────────────┐
│  Edit Mode      │   View Mode      │
│  (Instanced)    │   (Meshed)       │
└─────────────────┴──────────────────┘
```

---

## 2. Data Structure Design

### Sparse Voxel Storage

Only store what exists - no memory waste on empty space.

```typescript
// Sparse voxel storage - only store what exists
type VoxelCoord = `${number},${number},${number}`; // "x,y,z"

interface VoxelData {
  materialId: number;
  color?: string;
}

interface Chunk {
  x: number;
  y: number;
  z: number;
  voxels: Map<VoxelCoord, VoxelData>; // sparse storage
  dirty: boolean; // needs re-meshing
  mesh?: THREE.Mesh; // cached mesh for view mode
  instanceMatrix?: THREE.Matrix4[]; // for edit mode
}

interface Scene {
  chunks: Map<string, Chunk>;
  chunkSize: number; // typically 16 or 32
}
```

### Why This Structure?

- `Map` lookups are **O(1)**
- Sparse storage = **no memory waste** on empty space
- Chunks enable **spatial partitioning**
- Dirty flag prevents **unnecessary re-meshing**

---

## 3. Chunking System

### World Division

```
World divided into chunks:

Chunk (0,0,0)  |  Chunk (1,0,0)  |  Chunk (2,0,0)
     16³       |       16³       |      16³
----------------------------------------------------------------
Chunk (0,0,1)  |  Chunk (1,0,1)  |  Chunk (2,0,1)
```

### Benefits

- Only render **visible chunks** (frustum culling)
- Only re-mesh **modified chunks**
- Easy to **serialize/deserialize**
- Natural **LOD boundaries**

### Helper Functions

```typescript
function worldToChunk(x: number, y: number, z: number, chunkSize: number) {
  return {
    chunkX: Math.floor(x / chunkSize),
    chunkY: Math.floor(y / chunkSize),
    chunkZ: Math.floor(z / chunkSize),
    localX: ((x % chunkSize) + chunkSize) % chunkSize,
    localY: ((y % chunkSize) + chunkSize) % chunkSize,
    localZ: ((z % chunkSize) + chunkSize) % chunkSize,
  };
}

function chunkKey(cx: number, cy: number, cz: number): string {
  return `${cx},${cy},${cz}`;
}

function voxelKey(x: number, y: number, z: number): VoxelCoord {
  return `${x},${y},${z}`;
}
```

---

## 4. Greedy Meshing Algorithm

### The Key to Performance

Reduces polygons by **~95%**.

### Basic Concept

```
Before greedy meshing:        After greedy meshing:
████                          ████████
████  = 8 quads              = 1 quad
```

### Algorithm Steps

1. For each axis (X, Y, Z)
2. Sweep through layers
3. Find rectangular regions of same material
4. Combine into single quad
5. Mark voxels as processed

### Implementation

```typescript
interface Face {
  position: [number, number, number];
  width: number;
  height: number;
  axis: number;
  materialId: number;
}

function greedyMesh(chunk: Chunk, chunkSize: number): Face[] {
  const faces: Face[] = [];
  const directions = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  // For each axis
  for (let axis = 0; axis < 3; axis++) {
    const u = (axis + 1) % 3;
    const v = (axis + 2) % 3;

    // Sweep through each layer
    for (let d = 0; d < chunkSize; d++) {
      const mask = new Array(chunkSize * chunkSize).fill(null);

      // Build mask for this layer
      for (let i = 0; i < chunkSize; i++) {
        for (let j = 0; j < chunkSize; j++) {
          const pos = [0, 0, 0];
          pos[axis] = d;
          pos[u] = i;
          pos[v] = j;

          const voxel = getVoxel(chunk, pos);
          const neighbor = getVoxel(chunk, [
            pos[0] + directions[axis][0],
            pos[1] + directions[axis][1],
            pos[2] + directions[axis][2],
          ]);

          // Face is visible if voxel exists and neighbor doesn't
          if (voxel && !neighbor) {
            mask[i + j * chunkSize] = voxel.materialId;
          }
        }
      }

      // Generate quads from mask using greedy algorithm
      for (let j = 0; j < chunkSize; j++) {
        for (let i = 0; i < chunkSize; i++) {
          if (mask[i + j * chunkSize]) {
            const materialId = mask[i + j * chunkSize];

            // Find width
            let width = 1;
            while (
              i + width < chunkSize &&
              mask[i + width + j * chunkSize] === materialId
            ) {
              width++;
            }

            // Find height
            let height = 1;
            let done = false;
            while (j + height < chunkSize && !done) {
              for (let k = 0; k < width; k++) {
                if (mask[i + k + (j + height) * chunkSize] !== materialId) {
                  done = true;
                  break;
                }
              }
              if (!done) height++;
            }

            // Create quad
            faces.push({
              position: [i, j, d] as [number, number, number],
              width,
              height,
              axis,
              materialId,
            });

            // Clear mask for processed area
            for (let h = 0; h < height; h++) {
              for (let w = 0; w < width; w++) {
                mask[i + w + (j + h) * chunkSize] = null;
              }
            }
          }
        }
      }
    }
  }

  return faces;
}

function getVoxel(chunk: Chunk, pos: number[]): VoxelData | null {
  const key = voxelKey(pos[0], pos[1], pos[2]);
  return chunk.voxels.get(key) || null;
}
```

### Converting Faces to Geometry

```typescript
function facesToGeometry(
  faces: Face[],
  chunkSize: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let vertexOffset = 0;

  faces.forEach((face) => {
    const { position, width, height, axis, materialId } = face;

    // Calculate quad vertices based on axis
    const vertices = getQuadVertices(position, width, height, axis);
    const normal = getNormal(axis);

    // Add vertices
    vertices.forEach((v) => {
      positions.push(v[0], v[1], v[2]);
      normals.push(normal[0], normal[1], normal[2]);
    });

    // Add UVs
    uvs.push(0, 0, width, 0, width, height, 0, height);

    // Add indices (two triangles)
    indices.push(
      vertexOffset,
      vertexOffset + 1,
      vertexOffset + 2,
      vertexOffset,
      vertexOffset + 2,
      vertexOffset + 3
    );

    vertexOffset += 4;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}
```

---

## 5. Instanced Rendering (Edit Mode)

### One InstancedMesh Per Material Type

```typescript
class InstancedVoxelRenderer {
  private instancedMeshes: Map<number, THREE.InstancedMesh>;
  private geometry: THREE.BoxGeometry;

  constructor(
    materials: Map<number, THREE.Material>,
    maxVoxelsPerMaterial = 10000
  ) {
    this.instancedMeshes = new Map();

    // Create geometry once (unit cube)
    this.geometry = new THREE.BoxGeometry(1, 1, 1);

    // Create instanced mesh for each material
    materials.forEach((material, id) => {
      const mesh = new THREE.InstancedMesh(
        this.geometry,
        material,
        maxVoxelsPerMaterial
      );
      mesh.count = 0; // start with 0 instances
      this.instancedMeshes.set(id, mesh);
    });
  }

  updateInstances(chunk: Chunk) {
    // Group voxels by material
    const voxelsByMaterial = new Map<number, Array<[number, number, number]>>();

    chunk.voxels.forEach((voxel, coord) => {
      if (!voxelsByMaterial.has(voxel.materialId)) {
        voxelsByMaterial.set(voxel.materialId, []);
      }
      const [x, y, z] = coord.split(",").map(Number);
      voxelsByMaterial.get(voxel.materialId)!.push([x, y, z]);
    });

    // Update instance matrices
    const matrix = new THREE.Matrix4();
    voxelsByMaterial.forEach((positions, materialId) => {
      const mesh = this.instancedMeshes.get(materialId);
      if (!mesh) return;

      mesh.count = positions.length;

      positions.forEach((pos, i) => {
        matrix.setPosition(pos[0], pos[1], pos[2]);
        mesh.setMatrixAt(i, matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  getMeshes(): THREE.InstancedMesh[] {
    return Array.from(this.instancedMeshes.values());
  }

  dispose() {
    this.geometry.dispose();
    this.instancedMeshes.forEach((mesh) => {
      mesh.dispose();
    });
  }
}
```

---

## 6. Performance Optimizations Checklist

### Critical (Implement First)

- ✅ Chunking system (16×16×16 or 32×32×32)
- ✅ Instanced rendering for edit mode
- ✅ Greedy meshing for view mode
- ✅ Frustum culling (automatic with chunks as separate objects)
- ✅ Only re-mesh dirty chunks

### Important (Phase 2)

- ⚡ Web Worker for mesh generation (don't block main thread)
- ⚡ Object pooling for Three.js objects
- ⚡ Geometry buffering (reuse buffers)
- ⚡ Raycasting optimization (octree or chunk-based)

### Nice to Have (Phase 3)

- 🎯 LOD system (simplified meshes for distant chunks)
- 🎯 Occlusion culling (don't render completely hidden chunks)
- 🎯 Chunk streaming (load/unload as player moves)
- 🎯 Compression for storage (RLE or similar)

---

## 7. State Management Architecture

### Zustand Store Structure

```typescript
interface VoxelStore {
  // Data
  scene: Scene;
  chunks: Map<string, Chunk>;

  // Rendering mode
  editMode: boolean;

  // Selection
  selectedVoxel: [number, number, number] | null;
  currentMaterial: number;

  // Actions - Voxel Operations
  setVoxel: (x: number, y: number, z: number, voxel: VoxelData) => void;
  removeVoxel: (x: number, y: number, z: number) => void;
  getVoxel: (x: number, y: number, z: number) => VoxelData | null;

  // Actions - Chunk Management
  getChunk: (cx: number, cy: number, cz: number) => Chunk;
  markChunkDirty: (cx: number, cy: number, cz: number) => void;
  getOrCreateChunk: (cx: number, cy: number, cz: number) => Chunk;

  // Actions - Mode Switching
  setEditMode: (enabled: boolean) => void;

  // Actions - Material Selection
  setCurrentMaterial: (materialId: number) => void;

  // Actions - Scene Management
  clearScene: () => void;
  loadScene: (sceneData: any) => void;
  exportScene: () => any;
}

// Example implementation
const useVoxelStore = create<VoxelStore>((set, get) => ({
  scene: { chunks: new Map(), chunkSize: 16 },
  chunks: new Map(),
  editMode: true,
  selectedVoxel: null,
  currentMaterial: 0,

  setVoxel: (x, y, z, voxel) => {
    const { chunkSize } = get().scene;
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      x,
      y,
      z,
      chunkSize
    );

    const chunk = get().getOrCreateChunk(chunkX, chunkY, chunkZ);
    const key = voxelKey(localX, localY, localZ);
    chunk.voxels.set(key, voxel);
    chunk.dirty = true;

    set({ chunks: new Map(get().chunks) });
  },

  removeVoxel: (x, y, z) => {
    const { chunkSize } = get().scene;
    const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(
      x,
      y,
      z,
      chunkSize
    );

    const chunk = get().getChunk(chunkX, chunkY, chunkZ);
    if (!chunk) return;

    const key = voxelKey(localX, localY, localZ);
    chunk.voxels.delete(key);
    chunk.dirty = true;

    set({ chunks: new Map(get().chunks) });
  },

  getChunk: (cx, cy, cz) => {
    const key = chunkKey(cx, cy, cz);
    return get().chunks.get(key) || null;
  },

  getOrCreateChunk: (cx, cy, cz) => {
    const key = chunkKey(cx, cy, cz);
    let chunk = get().chunks.get(key);

    if (!chunk) {
      chunk = {
        x: cx,
        y: cy,
        z: cz,
        voxels: new Map(),
        dirty: true,
      };
      get().chunks.set(key, chunk);
    }

    return chunk;
  },

  markChunkDirty: (cx, cy, cz) => {
    const chunk = get().getChunk(cx, cy, cz);
    if (chunk) {
      chunk.dirty = true;
      set({ chunks: new Map(get().chunks) });
    }
  },

  setEditMode: (enabled) => set({ editMode: enabled }),
  setCurrentMaterial: (materialId) => set({ currentMaterial: materialId }),

  clearScene: () => {
    set({
      chunks: new Map(),
      selectedVoxel: null,
    });
  },

  loadScene: (sceneData) => {
    // Implementation for loading serialized scene
  },

  exportScene: () => {
    // Implementation for exporting scene
  },
}));
```

---

## 8. Rendering Pipeline Flow

```
User Edit (Click/Drag)
    ↓
Raycast to find voxel position
    ↓
Update Voxel Data (in sparse map)
    ↓
Mark Chunk as Dirty
    ↓
┌─────────────────────────────────────┐
│ Edit Mode?                          │
├────────────┬────────────────────────┤
│ YES        │ NO                     │
│            │                        │
│ Update     │ Schedule mesh          │
│ Instance   │ generation in          │
│ Matrices   │ Web Worker             │
│ (instant)  │                        │
│            │ ↓                      │
│            │ Receive optimized      │
│            │ geometry               │
│            │                        │
│            │ ↓                      │
│            │ Update chunk mesh      │
│            │                        │
│            │ ↓                      │
│            │ Mark chunk clean       │
└────────────┴────────────────────────┘
```

---

## 9. Web Worker Setup

### Why Use Web Workers?

- Greedy meshing is CPU-intensive
- Don't block the main thread (keep 60 FPS)
- Generate meshes in parallel

### Worker Structure

**voxel-mesh.worker.ts**

```typescript
// Web Worker for mesh generation
interface MeshRequest {
  chunkData: {
    voxels: Array<[string, VoxelData]>;
    chunkSize: number;
    position: [number, number, number];
  };
}

interface MeshResponse {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  position: [number, number, number];
}

self.onmessage = (e: MessageEvent<MeshRequest>) => {
  const { chunkData } = e.data;

  // Convert to chunk format
  const chunk: Chunk = {
    x: chunkData.position[0],
    y: chunkData.position[1],
    z: chunkData.position[2],
    voxels: new Map(chunkData.voxels),
    dirty: false,
  };

  // Generate mesh
  const faces = greedyMesh(chunk, chunkData.chunkSize);
  const geometry = facesToGeometry(faces, chunkData.chunkSize);

  // Extract buffer data
  const response: MeshResponse = {
    positions: geometry.attributes.position.array as Float32Array,
    normals: geometry.attributes.normal.array as Float32Array,
    uvs: geometry.attributes.uv.array as Float32Array,
    indices: geometry.index!.array as Uint32Array,
    position: chunkData.position,
  };

  self.postMessage(response, [
    response.positions.buffer,
    response.normals.buffer,
    response.uvs.buffer,
    response.indices.buffer,
  ]);
};
```

**Using the Worker**

```typescript
class MeshWorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    chunk: Chunk;
    callback: (data: MeshResponse) => void;
  }> = [];
  private activeWorkers = 0;

  constructor(poolSize = 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(
        new URL("./voxel-mesh.worker.ts", import.meta.url)
      );
      this.workers.push(worker);
    }
  }

  generateMesh(chunk: Chunk, chunkSize: number): Promise<MeshResponse> {
    return new Promise((resolve) => {
      const worker = this.getAvailableWorker();

      worker.onmessage = (e: MessageEvent<MeshResponse>) => {
        this.activeWorkers--;
        this.processQueue();
        resolve(e.data);
      };

      this.activeWorkers++;

      worker.postMessage({
        chunkData: {
          voxels: Array.from(chunk.voxels.entries()),
          chunkSize,
          position: [chunk.x, chunk.y, chunk.z],
        },
      });
    });
  }

  private getAvailableWorker(): Worker {
    return this.workers[this.activeWorkers % this.workers.length];
  }

  private processQueue() {
    // Process queued mesh generation requests
  }

  dispose() {
    this.workers.forEach((w) => w.terminate());
  }
}
```

---

## 10. Memory & Performance Targets

| Metric                | Target | Strategy                            |
| --------------------- | ------ | ----------------------------------- |
| Voxels rendered       | 100K+  | Greedy meshing + instancing         |
| Frame rate            | 60 FPS | Chunk culling, dirty flagging       |
| Edit latency          | <16ms  | Instanced updates, deferred meshing |
| Memory/10K voxels     | <50MB  | Sparse storage, shared geometries   |
| Chunk mesh time       | <100ms | Web Worker, incremental updates     |
| Max concurrent chunks | 1000+  | Efficient culling, LOD              |

---

## 11. Raycasting System

### Efficient Voxel Selection

```typescript
interface RaycastResult {
  voxel: [number, number, number];
  normal: [number, number, number];
  chunk: Chunk;
}

class VoxelRaycaster {
  private raycaster = new THREE.Raycaster();

  castRay(
    camera: THREE.Camera,
    mouse: { x: number; y: number },
    chunks: Map<string, Chunk>,
    maxDistance = 100
  ): RaycastResult | null {
    this.raycaster.setFromCamera(mouse, camera);

    const origin = this.raycaster.ray.origin;
    const direction = this.raycaster.ray.direction;

    // DDA (Digital Differential Analyzer) algorithm
    return this.dda(origin, direction, chunks, maxDistance);
  }

  private dda(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    chunks: Map<string, Chunk>,
    maxDistance: number
  ): RaycastResult | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);

    const tDeltaX = Math.abs(1 / direction.x);
    const tDeltaY = Math.abs(1 / direction.y);
    const tDeltaZ = Math.abs(1 / direction.z);

    let tMaxX = tDeltaX * (stepX > 0 ? 1 - (origin.x - x) : origin.x - x);
    let tMaxY = tDeltaY * (stepY > 0 ? 1 - (origin.y - y) : origin.y - y);
    let tMaxZ = tDeltaZ * (stepZ > 0 ? 1 - (origin.z - z) : origin.z - z);

    let distance = 0;
    let normal: [number, number, number] = [0, 0, 0];

    while (distance < maxDistance) {
      // Check if voxel exists
      const voxel = this.getVoxelAt(x, y, z, chunks);
      if (voxel) {
        return {
          voxel: [x, y, z],
          normal,
          chunk: this.getChunkForVoxel(x, y, z, chunks)!,
        };
      }

      // Step to next voxel
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          distance = tMaxX;
          tMaxX += tDeltaX;
          normal = [-stepX, 0, 0] as [number, number, number];
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = [0, 0, -stepZ] as [number, number, number];
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          distance = tMaxY;
          tMaxY += tDeltaY;
          normal = [0, -stepY, 0] as [number, number, number];
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = [0, 0, -stepZ] as [number, number, number];
        }
      }
    }

    return null;
  }

  private getVoxelAt(
    x: number,
    y: number,
    z: number,
    chunks: Map<string, Chunk>
  ): VoxelData | null {
    // Implementation
    return null;
  }

  private getChunkForVoxel(
    x: number,
    y: number,
    z: number,
    chunks: Map<string, Chunk>
  ): Chunk | null {
    // Implementation
    return null;
  }
}
```

---

## 12. Database Schema & Serialization

### Scene Storage Format

```typescript
interface SerializedScene {
  id: string;
  name: string;
  created: string;
  modified: string;
  metadata: {
    voxelCount: number;
    chunkCount: number;
    bounds: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
  chunks: SerializedChunk[];
}

interface SerializedChunk {
  position: [number, number, number];
  voxels: Array<{
    position: [number, number, number];
    materialId: number;
    color?: string;
  }>;
}

// Compression using Run-Length Encoding
interface CompressedChunk {
  position: [number, number, number];
  // RLE format: [materialId, count, materialId, count, ...]
  rle: Uint32Array;
}
```

### Library Object Format

```typescript
interface LibraryObject {
  id: string;
  name: string;
  description?: string;
  thumbnail: string; // base64 or URL
  tags: string[];
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
  voxels: Array<{
    position: [number, number, number];
    materialId: number;
    color?: string;
  }>;
}

interface PlacedObject {
  libraryObjectId: string;
  position: [number, number, number];
  rotation: [number, number, number]; // euler angles
  scale: [number, number, number];
}
```

### PostgreSQL Schema

```sql
-- Scenes table
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  chunk_data JSONB -- or separate table for large scenes
);

-- Library objects table
CREATE TABLE library_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail TEXT,
  tags TEXT[],
  bounds JSONB,
  voxel_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Placed objects (instances of library objects in scenes)
CREATE TABLE placed_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  library_object_id UUID REFERENCES library_objects(id),
  position JSONB,
  rotation JSONB,
  scale JSONB
);

-- Indexes for performance
CREATE INDEX idx_scenes_updated ON scenes(updated_at DESC);
CREATE INDEX idx_library_tags ON library_objects USING GIN(tags);
```

---

## 13. Component Architecture

### React Component Structure

```
src/
├── components/
│   ├── VoxelEditor.tsx          # Main editor component
│   ├── VoxelCanvas.tsx           # R3F Canvas wrapper
│   ├── ChunkRenderer.tsx         # Renders individual chunks
│   ├── VoxelControls.tsx         # Edit controls UI
│   ├── MaterialPalette.tsx       # Material selection
│   └── LibraryPanel.tsx          # Object library browser
├── core/
│   ├── VoxelEngine.ts            # Main voxel logic
│   ├── ChunkManager.ts           # Chunk lifecycle
│   ├── GreedyMesher.ts           # Meshing algorithm
│   ├── InstancedRenderer.ts     # Instanced rendering
│   └── VoxelRaycaster.ts        # Raycasting
├── workers/
│   └── mesh.worker.ts            # Mesh generation worker
├── store/
│   └── voxelStore.ts             # Zustand state
└── utils/
    ├── serialization.ts          # Save/load
    ├── compression.ts            # Data compression
    └── geometry.ts               # Geometry helpers
```

### Example R3F Component

```typescript
// VoxelCanvas.tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ChunkRenderer from "./ChunkRenderer";
import { useVoxelStore } from "../store/voxelStore";

export default function VoxelCanvas() {
  const { chunks, editMode } = useVoxelStore();

  return (
    <Canvas camera={{ position: [100, 100, 100] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 100, 50]} />

      {Array.from(chunks.values()).map((chunk) => (
        <ChunkRenderer
          key={`${chunk.x},${chunk.y},${chunk.z}`}
          chunk={chunk}
          editMode={editMode}
        />
      ))}

      <OrbitControls />
      <gridHelper args={[100, 100]} />
    </Canvas>
  );
}
```

```typescript
// ChunkRenderer.tsx
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { InstancedVoxelRenderer } from "../core/InstancedRenderer";

interface Props {
  chunk: Chunk;
  editMode: boolean;
}

export default function ChunkRenderer({ chunk, editMode }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const instancedRenderer = useRef<InstancedVoxelRenderer>();
  const meshRef = useRef<THREE.Mesh>();

  useEffect(() => {
    if (editMode) {
      // Setup instanced rendering
      if (!instancedRenderer.current) {
        instancedRenderer.current = new InstancedVoxelRenderer(materials);
      }
      instancedRenderer.current.updateInstances(chunk);
    } else {
      // Generate optimized mesh
      if (chunk.dirty) {
        generateMeshForChunk(chunk).then((geometry) => {
          if (meshRef.current) {
            meshRef.current.geometry.dispose();
            meshRef.current.geometry = geometry;
          }
          chunk.dirty = false;
        });
      }
    }
  }, [chunk, editMode]);

  return (
    <group ref={groupRef} position={[chunk.x * 16, chunk.y * 16, chunk.z * 16]}>
      {editMode ? (
        // Render instanced meshes
        instancedRenderer.current
          ?.getMeshes()
          .map((mesh, i) => <primitive key={i} object={mesh} />)
      ) : (
        // Render optimized mesh
        <mesh ref={meshRef}>
          <meshStandardMaterial />
        </mesh>
      )}
    </group>
  );
}
```

---

## 14. Implementation Priority Order

### Week 1: Foundation

**Goal:** Get basic voxel editing working

1. ✅ Setup project structure (Vite + React + R3F)
2. ✅ Implement sparse voxel data structure
3. ✅ Basic chunking system
4. ✅ Simple cube instancing (no meshing yet)
5. ✅ Camera controls (OrbitControls)
6. ✅ Raycasting for voxel selection
7. ✅ Add/remove voxels with mouse click

**Deliverable:** Can place and remove colored cubes in 3D space

### Week 2: Performance Core

**Goal:** Implement efficient rendering

8. ✅ Greedy meshing algorithm
9. ✅ Edit/View mode switching
10. ✅ Dirty chunk tracking system
11. ✅ Web Worker setup for mesh generation
12. ✅ Material system with multiple materials
13. ✅ Frustum culling verification

**Deliverable:** Can switch between edit mode (fast) and view mode (optimized)

### Week 3: User Experience

**Goal:** Make it usable and feature-complete

14. ✅ Material palette UI
15. ✅ Toolbar with brush sizes
16. ✅ Undo/redo system
17. ✅ Save/load to local storage
18. ✅ Export scene as JSON
19. ✅ Import scene from JSON
20. ✅ Camera presets (top, side, front views)

**Deliverable:** Functional voxel editor with basic features

### Week 4: Library & Database

**Goal:** Add object library and persistence

21. ✅ Library object creation (save selection as object)
22. ✅ Library browser UI
23. ✅ Drag & drop objects into scene
24. ✅ Database integration (PostgreSQL)
25. ✅ Thumbnail generation
26. ✅ Search and filter library objects

**Deliverable:** Can create, save, and reuse voxel objects

### Week 5: Optimization & Polish

**Goal:** Performance tuning and final features

27. ✅ Performance profiling and bottleneck identification
28. ✅ Memory optimization
29. ✅ Batch operations (fill, delete area)
30. ✅ LOD system (if needed)
31. ✅ Export to glTF/OBJ
32. ✅ Screenshot/render feature

**Deliverable:** Production-ready voxel scene maker

---

## 15. Testing Strategy

### Performance Benchmarks

```typescript
// Performance test cases
const benchmarks = {
  "Small scene (1K voxels)": {
    voxels: 1000,
    expectedFPS: 60,
    expectedMeshTime: "<50ms",
  },
  "Medium scene (10K voxels)": {
    voxels: 10000,
    expectedFPS: 60,
    expectedMeshTime: "<100ms",
  },
  "Large scene (100K voxels)": {
    voxels: 100000,
    expectedFPS: 60,
    expectedMeshTime: "<500ms",
  },
  "Massive scene (1M voxels)": {
    voxels: 1000000,
    expectedFPS: 30,
    expectedMeshTime: "<2s",
  },
};
```

### Test Scenarios

1. **Stress test**: Fill entire 64×64×64 area
2. **Edit performance**: Rapid voxel placement
3. **Memory test**: Create 1000 chunks, monitor RAM
4. **Save/load test**: Serialize/deserialize large scenes
5. **Worker test**: Verify mesh generation doesn't block UI

---

## 16. Potential Challenges & Solutions

| Challenge                  | Solution                                              |
| -------------------------- | ----------------------------------------------------- |
| Large scenes crash browser | Implement chunk streaming, unload distant chunks      |
| Mesh generation too slow   | Optimize greedy meshing, use faster algorithm         |
| Memory leaks               | Proper disposal of geometries/materials, use WeakMaps |
| Raycasting lag             | Spatial indexing (octree), check only nearby chunks   |
| Save data too large        | Implement compression (RLE, gzip)                     |
| Worker overhead            | Pool workers, batch mesh requests                     |

---

## 17. Future Enhancements

### Phase 2 Features

- 🎨 Advanced materials (emissive, transparent, metallic)
- 🖌️ Brush shapes (sphere, cylinder, custom)
- 🎭 Copy/paste/mirror/rotate selections
- 📐 Measurement tools
- 🌈 Color picker with palettes
- 💾 Auto-save
- 👥 Multiplayer editing (WebRTC)

### Phase 3 Features

- 🎬 Animation timeline
- 💡 Real-time lighting/shadows
- 🌊 Physics simulation
- 🎮 Export to game engines
- 🤖 AI-assisted generation
- 🎨 Texture painting on voxels
- 📦 Asset marketplace

---

## 18. Resources & References

### Key Libraries

- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
- **Three.js**: https://threejs.org/docs/
- **Zustand**: https://github.com/pmndrs/zustand
- **Drei**: https://github.com/pmndrs/drei

### Algorithms

- **Greedy Meshing**: https://0fps.net/2012/06/30/meshing-in-a-minecraft-game/
- **DDA Raycasting**: https://lodev.org/cgtutor/raycasting.html
- **Octrees**: https://en.wikipedia.org/wiki/Octree

### Performance

- **Instancing**: https://threejs.org/docs/#api/en/objects/InstancedMesh
- **Web Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API

---

## Next Steps

Choose your starting point:

1. **Quick Prototype** - Get instanced rendering working in a day
2. **Full Implementation** - Follow the 5-week plan
3. **Performance First** - Start with greedy meshing and chunking
4. **Feature First** - Build UI and editing tools first

Let me know which direction you'd like to go, and I can provide more detailed code examples for that specific area!
