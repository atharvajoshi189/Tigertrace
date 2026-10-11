import React, { useState } from 'react';
import { X, MapPin, Clock, Info, Camera, Eye, Radio, ExternalLink } from 'lucide-react';

const DetailPanel = ({ 
  feature, 
  onClose, 
  onSelectFeature, 
  setTrackedAnimalId, 
  appData 
}) => {
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  if (!feature) return null;

  // Helper to find camera object from appData
  const findCamera = (cameraId) => {
    if (!appData?.cameras) return null;
    return appData.cameras.find(c => c.id === cameraId);
  };

  // Helper to find animal object from appData
  const findAnimal = (animalId) => {
    if (!appData?.animals) return null;
    const all = [
      ...(appData.animals.tigers || []),
      ...(appData.animals.leopards || []),
      ...(appData.animals.slothBears || []),
      ...(appData.animals.wildDogs || []),
      ...(appData.animals.pangolins || [])
    ];
    return all.find(a => a.id === animalId);
  };

  const isAnimal = Boolean(
    feature.waypoints || 
    feature.sightings || 
    ['tiger', 'leopard', 'bear', 'dog', 'pangolin'].includes(feature.type)
  );

  const isCamera = Boolean(
    feature.category === 'Camera Trap' || 
    feature.detections !== undefined ||
    String(feature.id || '').startsWith('CT-')
  );

  const isSighting = feature.type === 'sighting';

  return (
    <>
      <div className="detail-panel">
        <div className="detail-header">
          <h2>
            {feature.emoji && <span>{feature.emoji} </span>}
            {feature.name || 'Feature Details'}
          </h2>
          <button className="close-btn" onClick={onClose} title="Close Panel">
            <X size={18} />
          </button>
        </div>

        <div className="detail-content">
          {/* Sighting Event View */}
          {isSighting && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="sighting-photo-wrapper" style={{ height: '180px', cursor: 'pointer' }} onClick={() => setEnlargedPhoto(feature.image)}>
                <img src={feature.image} alt={feature.name} className="sighting-photo-img" />
                <div className="sighting-photo-overlay">
                  <span className="sighting-confidence-tag">⚡ {feature.confidence}% AI Match</span>
                  <span className="sighting-cam-badge">{feature.cameraId}</span>
                </div>
              </div>

              <p><strong>Photographed Animal:</strong> {feature.animalName}</p>
              <p><strong>Camera Station:</strong> {feature.cameraName}</p>
              {feature.timestamp && (
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--accent-amber)" /> {new Date(feature.timestamp).toLocaleString()}
                </p>
              )}
              {feature.behavior && (
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.8rem', borderLeft: '3px solid #8b5cf6' }}>
                  <p style={{ margin: 0, fontStyle: 'italic', color: '#cbd5e1' }}>"{feature.behavior}"</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {feature.animalId && (
                  <button 
                    className="sighting-action-btn"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const anim = findAnimal(feature.animalId);
                      if (anim) {
                        if (setTrackedAnimalId) setTrackedAnimalId(anim.id);
                        if (onSelectFeature) onSelectFeature({ ...anim, emoji: '🐅' });
                      }
                    }}
                  >
                    🐾 Track Animal Trail
                  </button>
                )}
                {feature.cameraId && (
                  <button 
                    className="sighting-action-btn"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const cam = findCamera(feature.cameraId);
                      if (cam && onSelectFeature) {
                        onSelectFeature({ emoji: '📷', ...cam, category: 'Camera Trap' });
                      }
                    }}
                  >
                    📷 Camera Station
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Animal Details & Sighting Timeline */}
          {isAnimal && !isSighting && (
            <>
              {feature.type && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0 }}><strong>Species:</strong> {feature.type.charAt(0).toUpperCase() + feature.type.slice(1)}</p>
                  {feature.collarId && (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.4)' }}>
                      📡 {feature.collarId}
                    </span>
                  )}
                </div>
              )}

              {feature.gender && (
                <p><strong>Demographics:</strong> {feature.gender} {feature.age ? `• ${feature.age}` : ''}</p>
              )}

              {feature.territory && (
                <p><strong>Primary Territory:</strong> {feature.territory}</p>
              )}

              {feature.totalSightings !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                  <Radio size={16} color="#c4b5fd" />
                  <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>
                    Traced across <strong>{feature.totalSightings || feature.sightings?.length || 0} Camera Stations</strong>
                  </span>
                </div>
              )}

              {/* Camera Trap Sightings Timeline */}
              {feature.sightings && feature.sightings.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div className="sighting-section-title">
                    <span>Camera Trap Photo Sightings</span>
                    <span className="sighting-badge-count">{feature.sightings.length} captures</span>
                  </div>

                  <div className="sighting-timeline">
                    {feature.sightings.map((s, idx) => (
                      <div key={s.sightingId || idx} className="sighting-card">
                        <div className="sighting-card-header">
                          <span className="sighting-cam-name">{s.cameraName}</span>
                          <span className="sighting-time">
                            {new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {s.image && (
                          <div 
                            className="sighting-photo-wrapper" 
                            onClick={() => setEnlargedPhoto(s.image)}
                            title="Click to enlarge camera photo"
                            style={{ cursor: 'pointer' }}
                          >
                            <img src={s.image} alt={s.cameraName} className="sighting-photo-img" />
                            <div className="sighting-photo-overlay">
                              <span className="sighting-confidence-tag">⚡ {s.confidence}% AI</span>
                              <span className="sighting-cam-badge">{s.cameraId}</span>
                            </div>
                          </div>
                        )}

                        {s.behavior && (
                          <p className="sighting-behavior-note">"{s.behavior}"</p>
                        )}

                        <button 
                          type="button"
                          className="sighting-action-btn"
                          onClick={() => {
                            const cam = findCamera(s.cameraId);
                            if (cam && onSelectFeature) {
                              onSelectFeature({ emoji: '📷', ...cam, category: 'Camera Trap' });
                            }
                          }}
                        >
                          <MapPin size={13} />
                          Locate Camera {s.cameraId}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Camera Trap Details & Detections Log */}
          {isCamera && !isSighting && (
            <>
              {feature.id && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0 }}><strong>Station ID:</strong> {feature.id}</p>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    fontWeight: 600,
                    background: feature.status === 'Online' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                    color: feature.status === 'Online' ? '#4ade80' : '#f87171',
                    border: feature.status === 'Online' ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)'
                  }}>
                    ● {feature.status || 'Active'}
                  </span>
                </div>
              )}

              {feature.pos && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Coordinates:</strong> {Number(feature.pos[0]).toFixed(4)}° N, {Number(feature.pos[1]).toFixed(4)}° E
                </p>
              )}

              {feature.timestamp && (
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <Clock size={13} color="var(--accent-amber)" /> Last Trigger: {new Date(feature.timestamp).toLocaleString()}
                </p>
              )}

              {/* Detections recorded by this camera */}
              {feature.detections && feature.detections.length > 0 ? (
                <div style={{ marginTop: '8px' }}>
                  <div className="sighting-section-title">
                    <span>Captured Animals at Station</span>
                    <span className="sighting-badge-count">{feature.detections.length} sighted</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {feature.detections.map((det, idx) => (
                      <div key={idx} className="sighting-card">
                        <div className="sighting-card-header">
                          <span className="sighting-cam-name" style={{ color: 'var(--accent-amber)' }}>
                            🐾 {det.animalName}
                          </span>
                          <span className="sighting-time">
                            {new Date(det.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {det.image && (
                          <div 
                            className="sighting-photo-wrapper" 
                            style={{ height: '130px', cursor: 'pointer' }}
                            onClick={() => setEnlargedPhoto(det.image)}
                            title="Click to enlarge"
                          >
                            <img src={det.image} alt={det.animalName} className="sighting-photo-img" />
                            <div className="sighting-photo-overlay">
                              <span className="sighting-confidence-tag">⚡ {det.confidence}% AI match</span>
                              <span className="sighting-cam-badge">{det.animalType}</span>
                            </div>
                          </div>
                        )}

                        {det.behavior && (
                          <p className="sighting-behavior-note">"{det.behavior}"</p>
                        )}

                        <button 
                          type="button"
                          className="sighting-action-btn"
                          style={{ background: 'rgba(249, 115, 22, 0.2)', borderColor: 'rgba(249, 115, 22, 0.4)', color: '#fdba74' }}
                          onClick={() => {
                            const anim = findAnimal(det.animalId);
                            if (anim) {
                              if (setTrackedAnimalId) setTrackedAnimalId(anim.id);
                              if (onSelectFeature) onSelectFeature({ ...anim, emoji: '🐅' });
                            }
                          }}
                        >
                          <Eye size={13} />
                          Track {det.animalName.split(' ')[0]} Across Map
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem' }}>
                  No recent animal captures in this 24hr window
                </div>
              )}
            </>
          )}

          {/* Standard Feature Metadata (Gates, Villages, Waterbodies) */}
          {!isAnimal && !isCamera && !isSighting && (
            <>
              {feature.type && (
                <p><strong>Type:</strong> {feature.type.charAt(0).toUpperCase() + feature.type.slice(1)}</p>
              )}
              
              {feature.category && (
                <p><strong>Category:</strong> {feature.category}</p>
              )}
              
              {feature.zone && (
                <p><strong>Zone:</strong> {feature.zone}</p>
              )}

              {feature.id && (
                <p><strong>ID:</strong> {feature.id}</p>
              )}
              
              {feature.timestamp && (
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> {new Date(feature.timestamp).toLocaleString()}
                </p>
              )}
              
              {feature.aliases && feature.aliases.length > 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Aliases:</strong> {feature.aliases.join(', ')}
                </p>
              )}

              {(feature.latitude !== undefined && feature.longitude !== undefined) && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <strong>Coordinates:</strong> {Number(feature.latitude).toFixed(6)}° N, {Number(feature.longitude).toFixed(6)}° E
                </p>
              )}

              {feature.radius && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Radius:</strong> {feature.radius} meters
                </p>
              )}

              {feature.source && (
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', marginTop: '8px', fontSize: '0.85rem' }}>
                  <Info size={14} /> {feature.source}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setEnlargedPhoto(null)}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '800px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} color="#8b5cf6" /> Camera Trap Photo Capture
              </span>
              <button 
                onClick={() => setEnlargedPhoto(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <img 
              src={enlargedPhoto} 
              alt="Camera Trap Capture" 
              style={{ width: '100%', maxHeight: '65vh', objectFit: 'contain', background: '#000', display: 'block' }} 
            />
            <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Verified Wildlife Observation • Tadoba-Andhari Tiger Reserve</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>High Resolution Sensor Capture</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailPanel;
