import './App.css';
import VoxelCanvas from './components/VoxelCanvas';
import PaletteManager from './components/PaletteManager';
import LightControls from './components/LightControls';
import AssetBrowser from './components/AssetBrowser';
import { useVoxelStore } from './store/voxelStore';
import { MATERIAL_PRESETS, MATERIAL_CATEGORIES } from './core/materials';
import { useState } from 'react';

function App() {
  const editMode = useVoxelStore((state) => state.editMode);
  const currentMaterial = useVoxelStore((state) => state.currentMaterial);
  const voxelCount = useVoxelStore((state) => state.voxelCount);
  const planeMode = useVoxelStore((state) => state.planeMode);
  const planePosition = useVoxelStore((state) => state.planePosition);
  const setCurrentMaterial = useVoxelStore((state) => state.setCurrentMaterial);
  const setEditMode = useVoxelStore((state) => state.setEditMode);
  const setPlaneMode = useVoxelStore((state) => state.setPlaneMode);
  const setPlanePosition = useVoxelStore((state) => state.setPlanePosition);
  const movePlane = useVoxelStore((state) => state.movePlane);
  const clearScene = useVoxelStore((state) => state.clearScene);
  const stressTest = useVoxelStore((state) => state.stressTest);
  const buildExampleDockScene = useVoxelStore((state) => state.buildExampleDockScene);
  const buildCozyRoomScene = useVoxelStore((state) => state.buildCozyRoomScene);
  const placementMode = useVoxelStore((state) => state.placementMode);
  const setPlacementMode = useVoxelStore((state) => state.setPlacementMode);

  const [expandedCategory, setExpandedCategory] = useState<string | null>('softCozy');

  return (
    <div className="app">
      <div className="canvas-container">
        <VoxelCanvas />
      </div>

      <div className="ui-panel">
        <div className="panel-section">
          <h2>Stats</h2>
          <p>Voxels: {voxelCount.toLocaleString()} / 1,000,000</p>
        </div>

        <div className="panel-section">
          <h2>Controls</h2>
          <p>Left Click: Place Voxel</p>
          <p>Right Click: Remove Voxel</p>
          <p>Scroll: Zoom</p>
          <p>Drag: Rotate</p>
        </div>

        <div className="panel-section">
          <h2>Placement Mode</h2>
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
              Free (MC)
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
          <h2>Mode</h2>
          <label>
            <input
              type="checkbox"
              checked={editMode}
              onChange={(e) => setEditMode(e.target.checked)}
            />
            Edit Mode
          </label>
        </div>

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

        <AssetBrowser />

        <div className="panel-section">
          <h2>Stress Test</h2>
          <button className="action-btn" onClick={() => stressTest(1000)}>
            1K Voxels
          </button>
          <button className="action-btn" onClick={() => stressTest(10000)}>
            10K Voxels
          </button>
          <button className="action-btn" onClick={() => stressTest(50000)}>
            50K Voxels
          </button>
          <button className="action-btn" onClick={() => stressTest(100000)}>
            100K Voxels
          </button>
          <button className="action-btn" onClick={() => stressTest(500000)}>
            500K Voxels
          </button>
          <button className="action-btn" onClick={() => stressTest(1000000)}>
            1M Voxels (Max)
          </button>
        </div>

        <div className="panel-section">
          <button className="action-btn clear-btn" onClick={clearScene}>
            Clear Scene
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
