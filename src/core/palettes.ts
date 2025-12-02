// Palette saving and loading utilities
const PALETTE_STORAGE_KEY = 'voxel_palettes';

export interface SavedPalette {
  name: string;
  timestamp: number;
  materials: string[]; // Array of material IDs
}

export function savePalette(paletteName: string, materialIds: string[]): void {
  const palettes = getSavedPalettes();
  const newPalette: SavedPalette = {
    name: paletteName,
    timestamp: Date.now(),
    materials: materialIds,
  };

  // Update or add palette
  const existingIndex = palettes.findIndex((p) => p.name === paletteName);
  if (existingIndex >= 0) {
    palettes[existingIndex] = newPalette;
  } else {
    palettes.push(newPalette);
  }

  localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(palettes));
}

export function getSavedPalettes(): SavedPalette[] {
  try {
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function loadPalette(paletteName: string): string[] | null {
  const palettes = getSavedPalettes();
  const palette = palettes.find((p) => p.name === paletteName);
  return palette ? palette.materials : null;
}

export function deletePalette(paletteName: string): void {
  const palettes = getSavedPalettes();
  const filtered = palettes.filter((p) => p.name !== paletteName);
  localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(filtered));
}

export function exportPaletteAsJson(paletteName: string): string | null {
  const palette = loadPalette(paletteName);
  if (!palette) return null;

  return JSON.stringify(
    {
      name: paletteName,
      materials: palette,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export function importPaletteFromJson(jsonString: string, paletteName: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.materials) && data.materials.every((m: unknown) => typeof m === 'string')) {
      savePalette(paletteName, data.materials);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
