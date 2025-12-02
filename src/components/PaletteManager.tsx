import { useState } from 'react';
import { savePalette, getSavedPalettes, loadPalette, deletePalette, exportPaletteAsJson, importPaletteFromJson } from '../core/palettes';
import { MATERIAL_PRESETS } from '../core/materials';

interface PaletteManagerProps {
  onPaletteLoad: (materials: string[]) => void;
}

export default function PaletteManager({ onPaletteLoad }: PaletteManagerProps) {
  const [paletteName, setPaletteName] = useState('');
  const [savedPalettes, setSavedPalettes] = useState(getSavedPalettes());
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSavePalette = () => {
    if (!paletteName.trim()) {
      alert('Please enter a palette name');
      return;
    }

    const materialIds = Object.keys(MATERIAL_PRESETS);
    savePalette(paletteName, materialIds);
    setSavedPalettes(getSavedPalettes());
    setPaletteName('');
    alert(`Palette "${paletteName}" saved!`);
  };

  const handleLoadPalette = (name: string) => {
    const materials = loadPalette(name);
    if (materials) {
      onPaletteLoad(materials);
      alert(`Palette "${name}" loaded!`);
    }
  };

  const handleDeletePalette = (name: string) => {
    if (confirm(`Delete palette "${name}"?`)) {
      deletePalette(name);
      setSavedPalettes(getSavedPalettes());
    }
  };

  const handleExportPalette = (name: string) => {
    const json = exportPaletteAsJson(name);
    if (!json) return;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
    element.setAttribute('download', `${name}-palette.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImportPalette = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const importName = file.name.replace('-palette.json', '').replace('.json', '');
        if (importPaletteFromJson(json, importName)) {
          setSavedPalettes(getSavedPalettes());
          alert(`Palette "${importName}" imported!`);
        } else {
          alert('Invalid palette file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="palette-manager">
      <button
        className="palette-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        📚 Palette Manager {isExpanded ? '▼' : '▶'}
      </button>

      {isExpanded && (
        <div className="palette-content">
          <div className="palette-save">
            <input
              type="text"
              placeholder="Palette name"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              className="palette-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSavePalette();
              }}
            />
            <button className="palette-action-btn" onClick={handleSavePalette}>
              Save Palette
            </button>
          </div>

          <div className="palette-actions">
            <button className="palette-action-btn" onClick={handleImportPalette}>
              Import
            </button>
          </div>

          {savedPalettes.length > 0 && (
            <div className="saved-palettes">
              <h4>Saved Palettes:</h4>
              <div className="palette-list">
                {savedPalettes.map((palette) => (
                  <div key={palette.name} className="palette-item">
                    <button
                      className="palette-load-btn"
                      onClick={() => handleLoadPalette(palette.name)}
                    >
                      {palette.name}
                    </button>
                    <div className="palette-item-actions">
                      <button
                        className="palette-mini-btn"
                        title="Export"
                        onClick={() => handleExportPalette(palette.name)}
                      >
                        ⬇️
                      </button>
                      <button
                        className="palette-mini-btn delete"
                        title="Delete"
                        onClick={() => handleDeletePalette(palette.name)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
