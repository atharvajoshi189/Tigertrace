import React from 'react';
import { Map, MapPin, Target, Camera, Map as MapIcon, Compass, Sliders, Eye, Waves, Layers } from 'lucide-react';

const Sidebar = ({ mapStyle, setMapStyle, activeLayers, toggleLayer, applyPreset, overlayOpacity, setOverlayOpacity }) => {
  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <h1><Compass size={24} /> Tadoba Tracker</h1>
        <p>Wildlife Intelligence Platform</p>
      </div>

      <div className="control-group">
        <div className="control-title">Presets</div>
        <div className="preset-grid">
          <button className="preset-btn" onClick={() => applyPreset('exploration')}>🌲 Exploration</button>
          <button className="preset-btn" onClick={() => applyPreset('tracking')}>🐾 Tracking</button>
          <button className="preset-btn" onClick={() => applyPreset('cameras')}>📸 Cameras</button>
          <button className="preset-btn" onClick={() => applyPreset('density')}>🔥 Density</button>
        </div>
      </div>

      <div className="control-group">
        <div className="control-title">Map Style</div>
        <div className="btn-group">
          <button 
            className={`btn ${mapStyle === 'street' ? 'active' : ''}`}
            onClick={() => setMapStyle('street')}
          >
            <MapIcon size={18} /> Street View
          </button>
          <button 
            className={`btn ${mapStyle === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapStyle('satellite')}
          >
            <MapIcon size={18} /> Satellite View
          </button>
          <button 
            className={`btn ${mapStyle === 'terrain' ? 'active' : ''}`}
            onClick={() => setMapStyle('terrain')}
          >
            <Map size={18} /> Terrain View
          </button>
          <button 
            className={`btn ${mapStyle === 'hybrid' ? 'active' : ''}`}
            onClick={() => setMapStyle('hybrid')}
          >
            <MapIcon size={18} /> Hybrid View
          </button>
        </div>
      </div>

      <div className="control-group">
        <div className="control-title">Data Layers</div>
        <div className="btn-group">
          <button 
            className={`btn ${activeLayers.boundary ? 'active' : ''}`}
            onClick={() => toggleLayer('boundary')}
          >
            <MapPin size={18} /> Reserve Boundary
          </button>
          <button 
            className={`btn ${activeLayers.coreZone ? 'active' : ''}`}
            onClick={() => toggleLayer('coreZone')}
          >
            <MapPin size={18} /> Core Zone
          </button>
          <button 
            className={`btn ${activeLayers.gates ? 'active' : ''}`}
            onClick={() => toggleLayer('gates')}
          >
            <MapPin size={18} /> Safari Gates
          </button>
          <button 
            className={`btn ${activeLayers.villages ? 'active' : ''}`}
            onClick={() => toggleLayer('villages')}
          >
            <MapPin size={18} /> Villages
          </button>
          <button 
            className={`btn ${activeLayers.tigers ? 'active' : ''}`}
            onClick={() => toggleLayer('tigers')}
          >
            <Target size={18} /> Wildlife Trackers
          </button>
          <button 
            className={`btn ${activeLayers.leopards ? 'active' : ''}`}
            onClick={() => toggleLayer('leopards')}
          >
            <Target size={18} /> Leopard Trackers
          </button>
          <button 
            className={`btn ${activeLayers.trails ? 'active' : ''}`}
            onClick={() => toggleLayer('trails')}
          >
            <Layers size={18} /> Historical Trails
          </button>
          <button 
            className={`btn ${activeLayers.cameraTraps ? 'active' : ''}`}
            onClick={() => toggleLayer('cameraTraps')}
          >
            <Camera size={18} /> Camera Traps
          </button>
          <button 
            className={`btn ${activeLayers.waterBodies ? 'active' : ''}`}
            onClick={() => toggleLayer('waterBodies')}
          >
            <Waves size={18} /> Water Bodies (Analysis)
          </button>
          <button 
            className={`btn ${activeLayers.heatmap ? 'active' : ''}`}
            onClick={() => toggleLayer('heatmap')}
          >
            <Eye size={18} /> Sightings Heatmap
          </button>
        </div>
      </div>

      <div className="control-group mt-auto">
        <div className="control-title">Overlay Opacity</div>
        <input 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.1" 
          value={overlayOpacity}
          onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
          className="slider"
        />
      </div>
    </div>
  );
};

export default Sidebar;
