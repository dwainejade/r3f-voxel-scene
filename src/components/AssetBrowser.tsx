import { useVoxelStore } from '../store/voxelStore';
import { getAllAssets, getAssetsByCategory } from '../core/assets';
import { useState } from 'react';
import '../styles/AssetBrowser.css';

export default function AssetBrowser() {
  const assetLibrary = useVoxelStore((state) => state.assetLibrary);
  const planePosition = useVoxelStore((state) => state.planePosition);
  const placeAsset = useVoxelStore((state) => state.placeAsset);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('furniture');
  const [placementOffset, setPlacementOffset] = useState({ x: 0, y: 0, z: 0 });

  const categories = Array.from(assetLibrary.categories).sort();
  const assets = expandedCategory ? getAssetsByCategory(assetLibrary, expandedCategory) : getAllAssets(assetLibrary);

  const handlePlaceAsset = (assetId: string) => {
    // Place asset at current plane position with offset
    placeAsset(assetId, placementOffset.x, planePosition + placementOffset.y, placementOffset.z);
  };

  return (
    <div className="asset-browser panel-section">
      <h2>Asset Library</h2>

      <div className="placement-controls">
        <h3>Placement Position</h3>
        <div className="offset-inputs">
          <label>
            X: <input type="number" value={placementOffset.x} onChange={(e) => setPlacementOffset({ ...placementOffset, x: parseInt(e.target.value) })} />
          </label>
          <label>
            Y: <input type="number" value={placementOffset.y} onChange={(e) => setPlacementOffset({ ...placementOffset, y: parseInt(e.target.value) })} />
          </label>
          <label>
            Z: <input type="number" value={placementOffset.z} onChange={(e) => setPlacementOffset({ ...placementOffset, z: parseInt(e.target.value) })} />
          </label>
        </div>
      </div>

      <div className="asset-categories">
        <h3>Categories</h3>
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

      {expandedCategory && (
        <div className="asset-list">
          <h3>{expandedCategory.charAt(0).toUpperCase() + expandedCategory.slice(1)} Assets</h3>
          {assets.length === 0 ? (
            <p className="no-assets">No assets in this category</p>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="asset-item">
                <div className="asset-info">
                  <h4>{asset.name}</h4>
                  <p>{asset.description}</p>
                  <div className="asset-bounds">
                    Bounds: {asset.bounds.width} × {asset.bounds.height} × {asset.bounds.depth}
                  </div>
                </div>
                <button className="place-btn" onClick={() => handlePlaceAsset(asset.id)}>
                  Place
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
