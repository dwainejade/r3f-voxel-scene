import { useState } from 'react';
import { useVoxelStore } from '../store/voxelStore';

export default function LightControls() {
  const lights = useVoxelStore((state) => state.lights);
  const selectedLight = useVoxelStore((state) => state.selectedLight);
  const addLight = useVoxelStore((state) => state.addLight);
  const removeLight = useVoxelStore((state) => state.removeLight);
  const updateLight = useVoxelStore((state) => state.updateLight);
  const selectLight = useVoxelStore((state) => state.selectLight);
  const [isExpanded, setIsExpanded] = useState(true);

  const currentLight = lights.find((l) => l.id === selectedLight);

  return (
    <div className="light-controls-section">
      <button
        className="light-controls-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        💡 Lights {isExpanded ? '▼' : '▶'}
      </button>

      {isExpanded && (
        <div className="light-controls-content">
          <div className="light-add-buttons">
            <button
              className="light-add-btn"
              onClick={() => addLight('point', [0, 20, 0])}
              title="Add point light"
            >
              Point
            </button>
            <button
              className="light-add-btn"
              onClick={() => addLight('directional', [10, 30, 10])}
              title="Add directional light"
            >
              Directional
            </button>
            <button
              className="light-add-btn"
              onClick={() => addLight('spot', [0, 20, 0])}
              title="Add spot light"
            >
              Spot
            </button>
          </div>

          {lights.length > 0 && (
            <div className="light-list">
              <h4>Lights ({lights.length})</h4>
              {lights.map((light) => (
                <div key={light.id} className="light-item">
                  <button
                    className={`light-select-btn ${
                      selectedLight === light.id ? 'active' : ''
                    }`}
                    onClick={() => selectLight(light.id)}
                  >
                    <span className="light-type">{light.type}</span>
                  </button>
                  <button
                    className="light-remove-btn"
                    onClick={() => removeLight(light.id)}
                    title="Delete light"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {currentLight && (
            <div className="light-properties">
              <h4>Properties</h4>

              <div className="property-group">
                <label>Color</label>
                <input
                  type="color"
                  value={currentLight.color}
                  onChange={(e) =>
                    updateLight(currentLight.id, { color: e.target.value })
                  }
                  className="color-input"
                />
              </div>

              <div className="property-group">
                <label>
                  Intensity: <span>{currentLight.intensity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={currentLight.intensity}
                  onChange={(e) =>
                    updateLight(currentLight.id, {
                      intensity: parseFloat(e.target.value),
                    })
                  }
                  className="slider"
                />
              </div>

              <div className="property-group">
                <label>
                  X: <span>{currentLight.position[0].toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={currentLight.position[0]}
                  onChange={(e) =>
                    updateLight(currentLight.id, {
                      position: [
                        parseFloat(e.target.value),
                        currentLight.position[1],
                        currentLight.position[2],
                      ],
                    })
                  }
                  className="slider"
                />
              </div>

              <div className="property-group">
                <label>
                  Y: <span>{currentLight.position[1].toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={currentLight.position[1]}
                  onChange={(e) =>
                    updateLight(currentLight.id, {
                      position: [
                        currentLight.position[0],
                        parseFloat(e.target.value),
                        currentLight.position[2],
                      ],
                    })
                  }
                  className="slider"
                />
              </div>

              <div className="property-group">
                <label>
                  Z: <span>{currentLight.position[2].toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={currentLight.position[2]}
                  onChange={(e) =>
                    updateLight(currentLight.id, {
                      position: [
                        currentLight.position[0],
                        currentLight.position[1],
                        parseFloat(e.target.value),
                      ],
                    })
                  }
                  className="slider"
                />
              </div>

              {(currentLight.type === 'point' || currentLight.type === 'spot') && (
                <div className="property-group">
                  <label>
                    Distance: <span>{currentLight.distance?.toFixed(1) || 100}</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={currentLight.distance || 100}
                    onChange={(e) =>
                      updateLight(currentLight.id, {
                        distance: parseFloat(e.target.value),
                      })
                    }
                    className="slider"
                  />
                </div>
              )}

              <div className="property-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={currentLight.castShadow}
                    onChange={(e) =>
                      updateLight(currentLight.id, {
                        castShadow: e.target.checked,
                      })
                    }
                  />
                  Cast Shadow
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
