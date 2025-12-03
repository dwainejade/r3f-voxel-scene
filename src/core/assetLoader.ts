/**
 * Asset Loader
 * Loads exported assets from public/asset-library directory
 */

import type { AssetLibrary } from './assets';
import { createAssetFromExport } from './assetExport';
import type { ExportedAsset } from './assetExport';

/**
 * Load all assets from the public/asset-library directory
 */
export async function loadAssetsFromLibrary(library: AssetLibrary): Promise<void> {
  try {
    // Fetch the list of asset files
    const response = await fetch('/asset-library/manifest.json');

    if (!response.ok) {
      console.warn('Asset library manifest not found. Assets will not be auto-loaded.');
      return;
    }

    const manifest: { assets: string[] } = await response.json();

    // Load each asset file
    for (const assetFile of manifest.assets) {
      try {
        const assetResponse = await fetch(`/asset-library/${assetFile}`);
        if (!assetResponse.ok) {
          console.warn(`Failed to load asset: ${assetFile}`);
          continue;
        }

        const exportedAsset: ExportedAsset = await assetResponse.json();
        const asset = createAssetFromExport(exportedAsset);

        // Register the asset in the library
        library.assets.set(asset.id, asset);
        library.categories.add(asset.category);

        console.log(`Loaded asset: ${asset.name}`);
      } catch (error) {
        console.error(`Error loading asset ${assetFile}:`, error);
      }
    }
  } catch (error) {
    console.warn('Error loading asset library:', error);
  }
}
