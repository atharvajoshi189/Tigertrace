import React, { useState } from 'react';
import { Compass, Map as MapIcon, Layers } from 'lucide-react';

const DropdownMenu = ({ title, icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="dropdown-container" onMouseLeave={() => setIsOpen(false)}>
      <button className="dropdown-btn" onMouseEnter={() => setIsOpen(true)}>
        {icon} {title}
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {children}
        </div>
      )}
    </div>
  );
};

const TopBar = ({ mapStyle, setMapStyle, activeLayers, toggleLayer }) => {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <h1><Compass size={24} /> Tadoba Tracker</h1>
      </div>
      
      <div className="top-bar-controls">
        <DropdownMenu title="Map Style" icon={<MapIcon size={16} />}>
          <button className={`menu-item ${mapStyle === 'street' ? 'active' : ''}`} onClick={() => setMapStyle('street')}>Street View</button>
          <button className={`menu-item ${mapStyle === 'satellite' ? 'active' : ''}`} onClick={() => setMapStyle('satellite')}>Satellite View</button>
          <button className={`menu-item ${mapStyle === 'terrain' ? 'active' : ''}`} onClick={() => setMapStyle('terrain')}>Terrain View</button>
          <button className={`menu-item ${mapStyle === 'hybrid' ? 'active' : ''}`} onClick={() => setMapStyle('hybrid')}>Hybrid View</button>
        </DropdownMenu>

        <DropdownMenu title="Data Layers" icon={<Layers size={16} />}>
          <button className={`menu-item ${activeLayers.boundary ? 'active' : ''}`} onClick={() => toggleLayer('boundary')}>Reserve Boundary</button>
          <button className={`menu-item ${activeLayers.coreZone ? 'active' : ''}`} onClick={() => toggleLayer('coreZone')}>Core Zone</button>
          <button className={`menu-item ${activeLayers.gates ? 'active' : ''}`} onClick={() => toggleLayer('gates')}>Safari Gates</button>
          <button className={`menu-item ${activeLayers.villages ? 'active' : ''}`} onClick={() => toggleLayer('villages')}>Villages</button>
          <button className={`menu-item ${activeLayers.tigers ? 'active' : ''}`} onClick={() => toggleLayer('tigers')}>Wildlife Trackers</button>
          <button className={`menu-item ${activeLayers.trails ? 'active' : ''}`} onClick={() => toggleLayer('trails')}>Historical Trails</button>
          <button className={`menu-item ${activeLayers.cameraTraps ? 'active' : ''}`} onClick={() => toggleLayer('cameraTraps')}>Camera Traps</button>
          <button className={`menu-item ${activeLayers.heatmap ? 'active' : ''}`} onClick={() => toggleLayer('heatmap')}>Sightings Heatmap</button>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopBar;
