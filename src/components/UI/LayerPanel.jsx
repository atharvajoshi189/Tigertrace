import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

const LayerPanel = ({ 
  activeLayers, 
  toggleLayer, 
  appData, 
  trackedAnimalId, 
  setTrackedAnimalId, 
  trackingMode = 'single', 
  setTrackingMode, 
  setSelectedFeature 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const allAnimalsList = React.useMemo(() => {
    if (!appData || !appData.animals) return [];
    return [
      ...(appData.animals.tigers || []),
      ...(appData.animals.leopards || []),
      ...(appData.animals.slothBears || []),
      ...(appData.animals.wildDogs || []),
      ...(appData.animals.pangolins || [])
    ];
  }, [appData]);

  const getEmoji = (type) => {
    if (type === 'leopard') return '🐆';
    if (type === 'bear') return '🐻';
    if (type === 'dog') return '🦊';
    if (type === 'pangolin') return '🦎';
    return '🐅';
  };

  if (!isOpen) {
    return (
      <div className="floating-panel collapsed" onClick={() => setIsOpen(true)}>
        <Layers size={18} /> <span>Map Layers</span>
      </div>
    );
  }

  return (
    <div className="floating-panel">
      <div className="panel-header" onClick={() => setIsOpen(false)}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Layers size={18} /> 
          <span style={{fontWeight: 600}}>Map Layers</span>
        </div>
        <ChevronUp size={16} />
      </div>
      
      <div className="layer-group">
        <h4>Boundaries</h4>
        <label><input type="checkbox" checked={activeLayers.boundary} onChange={() => toggleLayer('boundary')} /> <span style={{width: 12, height: 12, border: '2px solid #10b981', background: 'rgba(16,185,129,0.2)', display: 'inline-block', borderRadius: 2}}></span> Reserve Boundary</label>
        <label><input type="checkbox" checked={activeLayers.coreZone} onChange={() => toggleLayer('coreZone')} /> <span style={{width: 12, height: 12, border: '2px solid #f59e0b', background: 'rgba(245,158,11,0.2)', display: 'inline-block', borderRadius: 2}}></span> Core Zone</label>
      </div>

      <div className="layer-group">
        <h4>Infrastructure & Features</h4>
        <label><input type="checkbox" checked={activeLayers.gates} onChange={() => toggleLayer('gates')} /> <span style={{width: 10, height: 10, background: '#f87171', display: 'inline-block', borderRadius: '50%'}}></span> Safari Gates</label>
        <label><input type="checkbox" checked={activeLayers.villages} onChange={() => toggleLayer('villages')} /> <span style={{width: 10, height: 10, background: '#4b5563', display: 'inline-block', borderRadius: '50%'}}></span> Villages</label>
        <label><input type="checkbox" checked={activeLayers.waterBodies} onChange={() => toggleLayer('waterBodies')} /> <span style={{width: 10, height: 10, background: '#3b82f6', display: 'inline-block', borderRadius: '50%'}}></span> Water Bodies</label>
        <label><input type="checkbox" checked={activeLayers.cameraTraps} onChange={() => toggleLayer('cameraTraps')} /> <span style={{width: 10, height: 10, background: '#8b5cf6', display: 'inline-block', borderRadius: '50%'}}></span> Camera Traps</label>
      </div>

      <div className="layer-group">
        <h4>Wildlife Data</h4>
        <label><input type="checkbox" checked={activeLayers.tigers} onChange={() => toggleLayer('tigers')} /> <span style={{width: 10, height: 10, background: '#f59e0b', display: 'inline-block', borderRadius: '50%', border: '1px solid #fff'}}></span> Animal Markers</label>
        <label><input type="checkbox" checked={activeLayers.trails} onChange={() => toggleLayer('trails')} /> <span style={{width: 16, height: 2, background: '#f59e0b', display: 'inline-block'}}></span> Movement Trails</label>

        {(activeLayers.trails || activeLayers.tigers) && (
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <button 
                type="button"
                onClick={() => setTrackingMode && setTrackingMode('single')}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: trackingMode === 'single' ? 'var(--accent-emerald, #10b981)' : 'rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              >
                🎯 Single Animal
              </button>
              <button 
                type="button"
                onClick={() => setTrackingMode && setTrackingMode('all')}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: trackingMode === 'all' ? 'var(--accent-emerald, #10b981)' : 'rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              >
                🌐 All Animals
              </button>
            </div>

            {trackingMode === 'single' && (
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                  Select Animal to Track:
                </span>
                <select 
                  value={trackedAnimalId || 'T-1'} 
                  onChange={(e) => {
                    const id = e.target.value;
                    if (setTrackedAnimalId) setTrackedAnimalId(id);
                    const animal = allAnimalsList.find(a => a.id === id);
                    if (animal && setSelectedFeature) {
                      setSelectedFeature({ ...animal, emoji: getEmoji(animal.type), source: 'GPS Collar' });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: '0.78rem',
                    background: 'rgba(15,23,42,0.85)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {allAnimalsList.map(a => (
                    <option key={a.id} value={a.id}>
                      {getEmoji(a.type)} {a.name || a.id} ({a.type})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', fontStyle: 'italic' }}>
                  Tip: Clicking any animal on the map switches tracking directly to it.
                </div>
              </div>
            )}
          </div>
        )}

        <label style={{ marginTop: '8px' }}><input type="checkbox" checked={activeLayers.heatmap} onChange={() => toggleLayer('heatmap')} /> <span style={{width: 12, height: 12, background: 'radial-gradient(circle, #facc15 0%, #ef4444 100%)', display: 'inline-block', borderRadius: '50%'}}></span> Sightings Heatmap</label>
      </div>
    </div>
  );
};

export default LayerPanel;
