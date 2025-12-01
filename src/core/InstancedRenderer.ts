import * as THREE from 'three';
import type { Chunk } from './types';

export class InstancedVoxelRenderer {
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
      mesh.count = 0;
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
      const [x, y, z] = coord.split(',').map(Number);
      voxelsByMaterial.get(voxel.materialId)!.push([x, y, z]);
    });

    // Update instance matrices for all materials
    const matrix = new THREE.Matrix4();
    this.instancedMeshes.forEach((mesh, materialId) => {
      const positions = voxelsByMaterial.get(materialId) || [];
      mesh.count = positions.length;

      positions.forEach((pos, i) => {
        matrix.setPosition(pos[0], pos[1], pos[2]);
        mesh.setMatrixAt(i, matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;

      // Compute bounding sphere to prevent frustum culling issues with camera angle changes
      mesh.computeBoundingSphere();
    });
  }

  getMeshes(): THREE.InstancedMesh[] {
    return Array.from(this.instancedMeshes.values());
  }

  dispose() {
    this.geometry.dispose();
    this.instancedMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
  }
}
