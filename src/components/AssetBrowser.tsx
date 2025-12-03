import { useVoxelStore } from '../store/voxelStore';
import { getAllAssets, getAssetsByCategory } from '../core/assets';
import { useState } from 'react';
import '../styles/AssetBrowser.css';

export default function AssetBrowser() {
  const assetLibrary = useVoxelStore((state) => state.assetLibrary);
  const assetPreview = useVoxelStore((state) => state.assetPreview);
  const startAssetPreview = useVoxelStore((state) => state.startAssetPreview);
  const confirmAssetPreview = useVoxelStore((state) => state.confirmAssetPreview);
  const cancelAssetPreview = useVoxelStore((state) => state.cancelAssetPreview);
  const rotateAssetPreview = useVoxelStore((state) => state.rotateAssetPreview);
  const adjustAssetHeight = useVoxelStore((state) => state.adjustAssetHeight);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('furniture');

  const categories = Array.from(assetLibrary.categories).sort();
  const assets = expandedCategory ? getAssetsByCategory(assetLibrary, expandedCategory) : getAllAssets(assetLibrary);

  const handleStartPlacingAsset = (assetId: string) => {
    startAssetPreview(assetId);
  };

  const handleConfirmPlacement = () => {
    confirmAssetPreview();
  };

  const handleCancelPlacement = () => {
    cancelAssetPreview();
  };

  return (
    <>
      <div className="asset-browser panel-section">
        <h2>Asset Library</h2>

        <div className="asset-categories">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${expandedCategory === category ? 'active' : ''}`}
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {assetPreview.assetId && (
          <div className="placement-status">
            <div className={`status-indicator ${assetPreview.canPlace ? 'can-place' : 'collision'}`}>
              {assetPreview.canPlace ? '✓ Placing' : '✗ Collision'}
            </div>
            <div className="adjustment-buttons">
              <button className="adjust-btn" onClick={() => rotateAssetPreview(-1)} title="Q">↺</button>
              <button className="adjust-btn" onClick={() => rotateAssetPreview(1)} title="E">↻</button>
              <button className="adjust-btn" onClick={() => adjustAssetHeight(-1)} title="↓">↓</button>
              <button className="adjust-btn" onClick={() => adjustAssetHeight(1)} title="↑">↑</button>
              <button className="confirm-btn" onClick={handleConfirmPlacement} disabled={!assetPreview.canPlace} title="Enter">✓</button>
              <button className="cancel-btn" onClick={handleCancelPlacement} title="Esc">✕</button>
            </div>
          </div>
        )}
      </div>

      {expandedCategory && (
        <div className="asset-grid-section panel-section">
          {assets.length === 0 ? (
            <p className="no-assets">No assets in this category</p>
          ) : (
            <div className="asset-grid">
              {assets.map((asset) => (
                <div key={asset.id} className="asset-card">
                  <button
                    className={`place-btn ${assetPreview.assetId === asset.id ? 'active' : ''}`}
                    onClick={() => handleStartPlacingAsset(asset.id)}
                    disabled={assetPreview.assetId !== null && assetPreview.assetId !== asset.id}
                    title={asset.name}
                  >
                    {asset.name.split('-')[0]}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
