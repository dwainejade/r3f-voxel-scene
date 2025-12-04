import { useVoxelStore } from '../store/voxelStore';
import { useEffect, useState } from 'react';

export default function VoxelSelection() {
  const selectedVoxel = useVoxelStore((state) => state.selectedVoxel);
  const selectedVoxels = useVoxelStore((state) => state.selectedVoxels);
  const setSelectedVoxel = useVoxelStore((state) => state.setSelectedVoxel);
  const removeVoxel = useVoxelStore((state) => state.removeVoxel);
  const clearSelection = useVoxelStore((state) => state.clearSelection);
  const deleteSelectedVoxels = useVoxelStore((state) => state.deleteSelectedVoxels);
  const [offset, setOffset] = useState([0, 0, 0]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle multi-selection keyboard shortcuts
      if (selectedVoxels.size > 0) {
        switch (e.key) {
          case 'Delete':
            e.preventDefault();
            deleteSelectedVoxels();
            break;
          case 'Escape':
            e.preventDefault();
            clearSelection();
            break;
          default:
            break;
        }
        return;
      }

      if (!selectedVoxel) return;

      const [x, y, z] = selectedVoxel;

      switch (e.key) {
        case 'Delete':
          e.preventDefault();
          removeVoxel(x, y, z);
          setSelectedVoxel(null);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setOffset([offset[0], offset[1] + 1, offset[2]]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setOffset([offset[0], offset[1] - 1, offset[2]]);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setOffset([offset[0] - 1, offset[1], offset[2]]);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setOffset([offset[0] + 1, offset[1], offset[2]]);
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedVoxel(null);
          setOffset([0, 0, 0]);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVoxel, selectedVoxels, removeVoxel, setSelectedVoxel, deleteSelectedVoxels, clearSelection, offset]);

  // Show multi-selection UI if there are multiple selected voxels
  if (selectedVoxels.size > 0) {
    const handleDeleteAll = () => {
      deleteSelectedVoxels();
    };

    const handleClearSelection = () => {
      clearSelection();
    };

    return (
      <div className="panel-section">
        <h2>Selected Voxels ({selectedVoxels.size})</h2>
        <div className="selection-info">
          <p>Voxels selected for bulk operations</p>
        </div>
        <div className="selection-actions">
          <button className="action-btn" onClick={handleDeleteAll}>
            Delete All ({selectedVoxels.size})
          </button>
          <button className="action-btn" onClick={handleClearSelection}>
            Clear Selection
          </button>
        </div>
        <p style={{ fontSize: '10px', color: '#888', margin: '8px 0 0 0' }}>
          Shift+paint to select multiple voxels | Delete to remove all | Esc to deselect
        </p>
      </div>
    );
  }

  if (!selectedVoxel) return null;

  const [x, y, z] = selectedVoxel;
  const displayX = x + offset[0];
  const displayY = y + offset[1];
  const displayZ = z + offset[2];

  const handleDelete = () => {
    removeVoxel(x, y, z);
    setSelectedVoxel(null);
    setOffset([0, 0, 0]);
  };

  const handleConfirm = () => {
    if (offset[0] !== 0 || offset[1] !== 0 || offset[2] !== 0) {
      // Move the voxel
      const voxel = useVoxelStore.getState().getVoxel(x, y, z);
      if (voxel) {
        removeVoxel(x, y, z);
        useVoxelStore.getState().setVoxel(displayX, displayY, displayZ, voxel);
        setSelectedVoxel([displayX, displayY, displayZ]);
        setOffset([0, 0, 0]);
      }
    }
  };

  const handleCancel = () => {
    setSelectedVoxel(null);
    setOffset([0, 0, 0]);
  };

  return (
    <div className="panel-section">
      <h2>Selected Voxel</h2>
      <div className="selection-info">
        <p>Position: [{x}, {y}, {z}]</p>
        {(offset[0] !== 0 || offset[1] !== 0 || offset[2] !== 0) && (
          <p>Move to: [{displayX}, {displayY}, {displayZ}]</p>
        )}
      </div>
      <div className="selection-actions">
        <button className="action-btn" onClick={handleDelete}>
          Delete
        </button>
        {(offset[0] !== 0 || offset[1] !== 0 || offset[2] !== 0) && (
          <>
            <button className="action-btn" onClick={handleConfirm}>
              Confirm Move
            </button>
            <button className="action-btn" onClick={handleCancel}>
              Cancel
            </button>
          </>
        )}
      </div>
      <p style={{ fontSize: '10px', color: '#888', margin: '8px 0 0 0' }}>
        ↑↓←→ to move | Delete to remove | Esc to deselect
      </p>
    </div>
  );
}
