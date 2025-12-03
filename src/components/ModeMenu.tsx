import React, { useState } from 'react';
import { useVoxelStore } from '../store/voxelStore';
import '../styles/ModeMenu.css';

export const ModeMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { appMode, setAppMode } = useVoxelStore();

  const handleModeChange = (mode: 'voxel-editing' | 'asset-creation') => {
    setAppMode(mode);
    setIsOpen(false);
  };

  return (
    <div className="mode-menu-container">
      <button className="mode-menu-toggle" onClick={() => setIsOpen(!isOpen)} title="Toggle mode menu">
        ⚙️
      </button>

      {isOpen && (
        <div className="mode-menu-dropdown">
          <div className="mode-menu-header">Mode</div>

          <button
            className={`mode-menu-item ${appMode === 'voxel-editing' ? 'active' : ''}`}
            onClick={() => handleModeChange('voxel-editing')}
          >
            🎨 Voxel Editing
          </button>

          <button
            className={`mode-menu-item ${appMode === 'asset-creation' ? 'active' : ''}`}
            onClick={() => handleModeChange('asset-creation')}
          >
            📦 Asset Creation
          </button>
        </div>
      )}
    </div>
  );
};
