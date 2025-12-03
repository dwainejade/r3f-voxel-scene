# Asset Library Guide

This guide explains how to create, export, and auto-load custom assets in the voxel editor.

## Creating Assets

1. Click the **mode menu icon (⚙️)** in the top-right corner
2. Select **"Asset Creation"** to enter asset creation mode
3. Use the building tools to create your asset:
   - Choose a **name** and **category** (furniture, decoration, structure, plant, or other)
   - Select a **voxel mode**: Select, Add, or Remove
   - Choose **placement mode**: Plane or Free
   - Select **materials** from the expandable categories
   - Place voxels by clicking on the canvas

4. Click **✅ Save** to add it to the asset library (available for current session)
5. Click **💾 Export** to download as a JSON file
6. Click **📂 Import** to load previously exported assets

## Auto-Loading Exported Assets

Assets exported from the app are saved as JSON files. To auto-load them when the app starts:

### Step 1: Export Your Assets
1. In Asset Creation Mode, create your asset
2. Click **💾 Export** to download the JSON file

### Step 2: Place Files in Asset Library Directory
Copy the exported JSON files to:
```
public/asset-library/
```

Example file structure:
```
public/asset-library/
├── manifest.json          (required)
├── wooden-chair.json
├── bookshelf.json
└── potted-plant.json
```

### Step 3: Update the Manifest
Edit `public/asset-library/manifest.json` to list your assets:

```json
{
  "assets": [
    "wooden-chair.json",
    "bookshelf.json",
    "potted-plant.json"
  ]
}
```

### Step 4: Reload the App
Refresh the browser. Your assets will be automatically loaded and appear in the **Asset Browser** tab (📦).

## Asset Workflow

### In Current Session (Temporary)
- **Create** → **Save** → Use in Asset Browser immediately
- Assets persist only while the app is open

### Persistent (Permanent)
- **Create** → **Export** → Place in `public/asset-library/` → Update manifest
- Assets load automatically on app startup

## Asset Browser

Once assets are loaded (either via Save or auto-load):
1. Go to the **Assets** tab (📦)
2. Browse assets by **category** or **search**
3. Click an asset to **preview** it
4. Click again to **place** it in your scene
5. Use **keyboard controls** to adjust placement:
   - **Arrow Up/Down**: Change height
   - **Q/E**: Rotate
   - **Enter**: Confirm placement
   - **Escape**: Cancel

## Asset File Format

Exported assets are JSON files with the following structure:

```json
{
  "version": 1,
  "asset": {
    "id": "custom-1234567890-abc123def",
    "name": "Wooden Chair",
    "category": "furniture",
    "description": "A simple wooden chair",
    "bounds": {
      "width": 2,
      "height": 3,
      "depth": 2
    },
    "voxels": [
      { "x": 0, "y": 0, "z": 0, "material": "walnut" },
      { "x": 1, "y": 0, "z": 0, "material": "walnut" },
      ...
    ],
    "createdAt": "2025-12-03T12:34:56.789Z"
  }
}
```

## Tips

- **Organize by category**: Use meaningful categories to keep your library organized
- **Test before exporting**: Save first and test placement before exporting
- **Name your files clearly**: Use descriptive names like `wooden-desk.json`, not `asset-1.json`
- **Version control**: Keep exported assets in version control for backup
