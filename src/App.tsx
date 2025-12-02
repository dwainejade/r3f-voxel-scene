import './App.css';
import VoxelCanvas from './components/VoxelCanvas';
import { useVoxelStore } from './store/voxelStore';

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
  const placementMode = useVoxelStore((state) => state.placementMode);
  const setPlacementMode = useVoxelStore((state) => state.setPlacementMode);

  const materials = [
    { id: 0, name: 'Red', color: '#ff6b6b' },
    { id: 1, name: 'Green', color: '#51cf66' },
    { id: 2, name: 'Blue', color: '#4dabf7' },
    { id: 3, name: 'Yellow', color: '#ffd43b' },
    { id: 4, name: 'Purple', color: '#da77f2' },
  ];

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
          <h2>Material</h2>
          <div className="material-palette">
            {materials.map((material) => (
              <button
                key={material.id}
                className={`material-btn ${
                  currentMaterial === material.id ? 'active' : ''
                }`}
                style={{ backgroundColor: material.color }}
                onClick={() => setCurrentMaterial(material.id)}
                title={material.name}
              />
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h2>Example Scene</h2>
          <button className="action-btn" onClick={buildExampleDockScene}>
            Build Dock Scene
          </button>
        </div>

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
