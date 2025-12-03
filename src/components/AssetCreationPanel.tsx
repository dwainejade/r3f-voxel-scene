import React, { useRef, useState } from 'react';
import { useVoxelStore, type AssetCategory } from '../store/voxelStore';
import { exportAssetToFile, importAssetFromFile } from '../core/assetExport';
import { registerAsset } from '../core/assets';
import { MATERIAL_PRESETS, MATERIAL_CATEGORIES } from '../core/materials';
import '../styles/AssetCreationPanel.css';

const CATEGORIES: AssetCategory[] = ['furniture', 'decoration', 'structure', 'plant', 'other'];

export const AssetCreationPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAssetInfo, setShowAssetInfo] = useState(false);
  const [savedAssets, setSavedAssets] = useState<Array<{ name: string; category: AssetCategory; voxelCount: number }>>([]);
  const [expandedMaterialCategory, setExpandedMaterialCategory] = useState<string | null>('softCozy');

  const {
    assetCreationState,
    updateAssetCreationInfo,
    saveAssetToLibrary,
    cancelAssetCreation,
    getAssetCreationVoxels,
    currentMaterial,
    setCurrentMaterial,
    voxelMode,
    setVoxelMode,
    placementMode,
    setPlacementMode,
    assetLibrary,
  } = useVoxelStore();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAssetCreationInfo(e.target.value, assetCreationState.assetCategory, assetCreationState.assetDescription);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAssetCreationInfo(
      assetCreationState.assetName,
      e.target.value as AssetCategory,
      assetCreationState.assetDescription
    );
  };

  const handleSaveToLibrary = () => {
    const voxels = getAssetCreationVoxels();

    if (voxels.length === 0) {
      alert('Please place some voxels before saving');
      return;
    }

    if (!assetCreationState.assetName.trim()) {
      alert('Please enter an asset name');
      return;
    }

    saveAssetToLibrary(
      assetCreationState.assetName,
      assetCreationState.assetCategory,
      assetCreationState.assetDescription
    );

    // Track saved asset
    setSavedAssets([
      ...savedAssets,
      {
        name: assetCreationState.assetName,
        category: assetCreationState.assetCategory,
        voxelCount: voxels.length,
      },
    ]);

    setShowAssetInfo(true);
  };

  const handleExportAsset = () => {
    const voxels = getAssetCreationVoxels();

    if (voxels.length === 0) {
      alert('Please place some voxels before exporting');
      return;
    }

    if (!assetCreationState.assetName.trim()) {
      alert('Please enter an asset name');
      return;
    }

    try {
      exportAssetToFile(
        assetCreationState.assetName,
        assetCreationState.assetCategory,
        assetCreationState.assetDescription,
        voxels
      );
      alert(`Asset "${assetCreationState.assetName}" exported successfully!`);
    } catch (error) {
      alert('Error exporting asset: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleImportAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const asset = await importAssetFromFile(file);
      if (asset) {
        registerAsset(assetLibrary, asset);
        alert(`Asset "${asset.name}" imported successfully!`);
      } else {
        alert('Failed to import asset');
      }
    } catch (error) {
      alert('Error importing asset: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const voxels = getAssetCreationVoxels();
  const bounds =
    voxels.length > 0
      ? {
          minX: Math.min(...voxels.map((v) => v.x)),
          maxX: Math.max(...voxels.map((v) => v.x)),
          minY: Math.min(...voxels.map((v) => v.y)),
          maxY: Math.max(...voxels.map((v) => v.y)),
          minZ: Math.min(...voxels.map((v) => v.z)),
          maxZ: Math.max(...voxels.map((v) => v.z)),
        }
      : null;

  if (showAssetInfo) {
    return (
      <div className="asset-creation-panel asset-info-view">
        <div className="panel-section">
          <h2>Saved Assets</h2>
          <div className="saved-assets-list">
            {savedAssets.map((asset, idx) => (
              <div key={idx} className="saved-asset-item">
                <div className="asset-icon">{asset.category === 'furniture' ? '🪑' : asset.category === 'decoration' ? '✨' : asset.category === 'plant' ? '🌿' : asset.category === 'structure' ? '🏗️' : '📦'}</div>
                <div className="asset-details">
                  <div className="asset-name">{asset.name}</div>
                  <div className="asset-meta">{asset.category} • {asset.voxelCount} voxels</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h2>What's Next?</h2>
          <button className="action-btn" onClick={() => setShowAssetInfo(false)}>
            ← Continue Building
          </button>
          <button className="action-btn" onClick={cancelAssetCreation}>
            Exit to Voxel Editing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="asset-creation-panel">
      <div className="panel-section">
        <h2>Asset Setup</h2>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="asset-name">Name *</label>
            <input
              id="asset-name"
              type="text"
              placeholder="e.g., Wooden Chair"
              value={assetCreationState.assetName}
              onChange={handleNameChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="asset-category">Category *</label>
            <select value={assetCreationState.assetCategory} onChange={handleCategoryChange}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="asset-description">Description</label>
            <input
              id="asset-description"
              type="text"
              placeholder="Brief description..."
              value={assetCreationState.assetDescription}
              onChange={(e) =>
                updateAssetCreationInfo(assetCreationState.assetName, assetCreationState.assetCategory, e.target.value)
              }
            />
          </div>
        </div>

        {bounds && (
          <div className="bounds-info-inline">
            <span>Bounds: {bounds.maxX - bounds.minX + 1}×{bounds.maxY - bounds.minY + 1}×{bounds.maxZ - bounds.minZ + 1}</span>
            <span>Voxels: {voxels.length}</span>
          </div>
        )}
      </div>

      <div className="panel-section">
        <h2>Building Tools</h2>

        <div className="tool-row">
          <div className="form-group">
            <label>Voxel Mode</label>
            <div className="mode-buttons">
              <button
                className={`mode-btn ${voxelMode === 'select' ? 'active' : ''}`}
                onClick={() => setVoxelMode('select')}
              >
                Select
              </button>
              <button
                className={`mode-btn ${voxelMode === 'add' ? 'active' : ''}`}
                onClick={() => setVoxelMode('add')}
              >
                Add
              </button>
              <button
                className={`mode-btn ${voxelMode === 'remove' ? 'active' : ''}`}
                onClick={() => setVoxelMode('remove')}
              >
                Remove
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Placement</label>
            <div className="mode-buttons">
              <button
                className={`mode-btn ${placementMode === 'plane' ? 'active' : ''}`}
                onClick={() => setPlacementMode('plane')}
              >
                Plane
              </button>
              <button
                className={`mode-btn ${placementMode === 'free' ? 'active' : ''}`}
                onClick={() => setPlacementMode('free')}
              >
                Free
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Material</label>
            <div className="material-selector-compact">
              {Object.entries(MATERIAL_CATEGORIES).map(([categoryName, materialIds]) => (
                <div key={categoryName} className="material-category-compact">
                  <button
                    className="category-toggle-compact"
                    onClick={() => setExpandedMaterialCategory(expandedMaterialCategory === categoryName ? null : categoryName)}
                  >
                    {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                  </button>
                  {expandedMaterialCategory === categoryName && (
                    <div className="material-palette-compact">
                      {materialIds.map((materialId) => {
                        const material = MATERIAL_PRESETS[materialId];
                        return (
                          <button
                            key={material.id}
                            className={`material-btn-compact ${
                              currentMaterial === material.id ? 'active' : ''
                            }`}
                            style={{ backgroundColor: material.color }}
                            onClick={() => setCurrentMaterial(material.id)}
                            title={material.name}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h2>Actions</h2>

        <div className="action-row">
          <button className="btn btn-primary" onClick={handleSaveToLibrary}>
            ✅ Save
          </button>

          <button className="btn btn-secondary" onClick={handleExportAsset}>
            💾 Export
          </button>

          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            📂 Import
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportAsset}
            style={{ display: 'none' }}
          />

          <button className="btn btn-danger" onClick={cancelAssetCreation}>
            ❌ Exit
          </button>
        </div>
      </div>
    </div>
  );
};
