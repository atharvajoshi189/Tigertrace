import React, { useState, useEffect, useRef } from 'react';
import { Leaf, Search, Map as MapIcon, Maximize, Compass } from 'lucide-react';

const TopBar = ({ mapStyle, setMapStyle, is3D, setIs3D, appData, setSelectedFeature }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.length < 2 || !appData) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const q = val.toLowerCase();
    const matches = [];

    // Search animals
    if (appData.animals) {
      ['tigers', 'leopards', 'slothBears', 'wildDogs', 'pangolins'].forEach(cat => {
        if(appData.animals[cat]) {
          appData.animals[cat].forEach(a => {
            if (a.name?.toLowerCase().includes(q) || a.id?.toLowerCase().includes(q)) {
              let emoji = '🐅';
              if(a.type==='leopard') emoji='🐆';
              if(a.type==='bear') emoji='🐻';
              if(a.type==='dog') emoji='🦊';
              if(a.type==='pangolin') emoji='🦎';
              matches.push({ ...a, emoji, label: `${a.name} (${a.id}) - ${a.type}`, source: 'GPS Collar', lat: a.waypoints[a.waypoints.length-1]?.lat, lng: a.waypoints[a.waypoints.length-1]?.lng });
            }
          });
        }
      });
    }

    // Search gates
    if (appData.gates) {
      appData.gates.features.forEach(g => {
        const nameMatch = g.properties.name?.toLowerCase().includes(q);
        const aliasMatch = g.properties.aliases?.some(a => a.toLowerCase().includes(q));
        if (nameMatch || aliasMatch) {
          const label = g.properties.name.endsWith('Gate') ? g.properties.name : `${g.properties.name} Gate`;
          matches.push({ ...g.properties, emoji: '🏕️', label, geometry: g.geometry });
        }
      });
    }

    // Search villages
    if (appData.villages) {
      appData.villages.features.forEach(v => {
        if (v.properties.name?.toLowerCase().includes(q)) {
          matches.push({ ...v.properties, emoji: '🏠', label: `${v.properties.name} Village`, geometry: v.geometry });
        }
      });
    }

    // Search cameras
    if (appData.cameras) {
      appData.cameras.forEach(c => {
        if (c.name?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q)) {
          matches.push({ ...c, emoji: '📸', label: `${c.name} (${c.id})`, geometry: { type: 'Point', coordinates: [c.pos[1], c.pos[0]] } });
        }
      });
    }

    // Search water bodies
    if (appData.waterBodies) {
      appData.waterBodies.forEach(w => {
        if (w.name?.toLowerCase().includes(q)) {
          matches.push({ ...w, emoji: '💧', label: w.name, geometry: { type: 'Point', coordinates: [w.pos[1], w.pos[0]] } });
        }
      });
    }

    setResults(matches);
    setShowResults(true);
  };

  const handleSelect = (feat) => {
    setSelectedFeature(feat);
    setShowResults(false);
    setQuery('');
  };
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <Leaf size={24} color="var(--accent-emerald)" />
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <h1 style={{fontSize: '1.1rem', margin: 0, fontWeight: 700}}>TADOBA</h1>
          <span style={{fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px'}}>WILDLIFE INTELLIGENCE</span>
        </div>
      </div>
      
      <div className="top-bar-center">
        <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search location, animal, gate, village..." 
            value={query}
            onChange={handleSearch}
            onFocus={() => { if(results.length > 0) setShowResults(true); }}
          />
          {showResults && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-panel-solid)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto', zIndex: 3000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              {results.length > 0 ? results.map((r, i) => (
                <div key={i} onClick={() => handleSelect(r)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                </div>
              )) : (
                <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching features found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="top-bar-controls">
        <button id="btn-toggle-2d" className={`toggle-btn ${!is3D ? 'active' : ''}`} onClick={() => setIs3D(false)}>2D</button>
        <button id="btn-toggle-3d" className={`toggle-btn ${is3D ? 'active' : ''}`} onClick={() => setIs3D(true)}>3D</button>
        
        <div className="style-selector">
          <MapIcon size={16} />
          <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)}>
            <option value="satellite">Satellite</option>
            <option value="terrain">Terrain</option>
            <option value="hybrid">Hybrid</option>
            <option value="street">Street</option>
          </select>
        </div>

        <div className="coord-display">
          <Compass size={14} /> 20.25° N, 79.40° E
        </div>
        
        <button className="icon-btn" onClick={() => document.documentElement.requestFullscreen()}>
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
