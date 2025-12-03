import './App.css';
import VoxelCanvas from './components/VoxelCanvas';
import PaletteManager from './components/PaletteManager';
import LightControls from './components/LightControls';
import AssetBrowser from './components/AssetBrowser';
import VoxelSelection from './components/VoxelSelection';
import { ModeMenu } from './components/ModeMenu';
import { AssetCreationPanel } from './components/AssetCreationPanel';
import { useVoxelStore } from './store/voxelStore';
import { MATERIAL_PRESETS, MATERIAL_CATEGORIES } from './core/materials';
import { useState, useEffect } from 'react';

type BuildTab = 'voxels' | 'scenes' | 'assets';

function App() {
  const currentMaterial = useVoxelStore((state) => state.currentMaterial);
  const voxelCount = useVoxelStore((state) => state.voxelCount);
  const planeMode = useVoxelStore((state) => state.planeMode);
  const planePosition = useVoxelStore((state) => state.planePosition);
  const setCurrentMaterial = useVoxelStore((state) => state.setCurrentMaterial);
  const setPlaneMode = useVoxelStore((state) => state.setPlaneMode);
  const setPlanePosition = useVoxelStore((state) => state.setPlanePosition);
  const movePlane = useVoxelStore((state) => state.movePlane);
  const clearScene = useVoxelStore((state) => state.clearScene);
  const buildExampleDockScene = useVoxelStore((state) => state.buildExampleDockScene);
  const buildCozyRoomScene = useVoxelStore((state) => state.buildCozyRoomScene);
  const voxelMode = useVoxelStore((state) => state.voxelMode);
  const setVoxelMode = useVoxelStore((state) => state.setVoxelMode);
  const placementMode = useVoxelStore((state) => state.placementMode);
  const appMode = useVoxelStore((state) => state.appMode);
  const loadAssetLibrary = useVoxelStore((state) => state.loadAssetLibrary);

  const [activeTab, setActiveTab] = useState<BuildTab>('voxels');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('softCozy');

  // Load assets from public/asset-library on mount
  useEffect(() => {
    loadAssetLibrary();
  }, [loadAssetLibrary]);

  return (
    <div className="app">
      <div className="canvas-container">
        <VoxelCanvas />
        <ModeMenu />
      </div>

      <div className="ui-panel">
        {/* Asset Creation Mode */}
        {appMode === 'asset-creation' ? (
          <AssetCreationPanel />
        ) : (
          <>
        {/* Tab Navigation */}
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activeTab === 'voxels' ? 'active' : ''}`}
            onClick={() => setActiveTab('voxels')}
            title="Voxel Placement"
          >
            🧱
          </button>
          <button
            className={`panel-tab ${activeTab === 'scenes' ? 'active' : ''}`}
            onClick={() => setActiveTab('scenes')}
            title="Scenes & Rooms"
          >
            🏠
          </button>
          <button
            className={`panel-tab ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
            title="Assets Library"
          >
            📦
          </button>
        </div>

        {/* Tab Content */}
        <div className="panel-content">
          {activeTab === 'voxels' && (
            <>
              <VoxelSelection />

              <div className="panel-section">
                <h2>Stats</h2>
                <p>Voxels: {voxelCount.toLocaleString()} / 1,000,000</p>
              </div>

              <div className="panel-section">
                <h2>Voxel Mode</h2>
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

              {placementMode === 'plane' && (
                <div className="panel-section">
                  <h2>Plane Controls</h2>
                  <div className="plane-buttons">
                    {(['x', 'y', 'z'] as const).map((mode) => (
                      <button
                        key={mode}
                        className={`plane-btn ${planeMode === mode ? 'active' : ''}`}
                        onClick={() => setPlaneMode(mode)}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="plane-controls">
                    <button className="plane-move-btn" onClick={() => movePlane(-1)}>−</button>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={planePosition}
                      onChange={(e) => setPlanePosition(parseInt(e.target.value))}
                      className="plane-slider"
                    />
                    <button className="plane-move-btn" onClick={() => movePlane(1)}>+</button>
                  </div>
                  <p className="plane-position">Position: {planePosition}</p>
                </div>
              )}

              <div className="panel-section">
                <h2>Materials</h2>
                <div className="material-categories">
                  {Object.entries(MATERIAL_CATEGORIES).map(([categoryName, materialIds]) => (
                    <div key={categoryName} className="material-category">
                      <button
                        className="category-toggle"
                        onClick={() => setExpandedCategory(expandedCategory === categoryName ? null : categoryName)}
                      >
                        {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                      </button>
                      {expandedCategory === categoryName && (
                        <div className="material-palette">
                          {materialIds.map((materialId) => {
                            const material = MATERIAL_PRESETS[materialId];
                            return (
                              <button
                                key={material.id}
                                className={`material-btn ${
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
            </>
          )}

          {activeTab === 'scenes' && (
            <>
              <div className="panel-section">
                <h2>Example Scenes</h2>
                <button className="action-btn" onClick={buildExampleDockScene}>
                  Build Dock Scene
                </button>
                <button className="action-btn" onClick={buildCozyRoomScene}>
                  Build Cozy Room
                </button>
              </div>

              <PaletteManager onPaletteLoad={() => {}} />

              <LightControls />

              <div className="panel-section">
                <h2>Tools</h2>
                <button className="action-btn clear-btn" onClick={clearScene}>
                  Clear Scene
                </button>
              </div>
            </>
          )}

          {activeTab === 'assets' && (
            <AssetBrowser />
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
