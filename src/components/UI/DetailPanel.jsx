import React from 'react';
import { X, MapPin, Clock, Info } from 'lucide-react';

const DetailPanel = ({ feature, onClose }) => {
  if (!feature) return null;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h2>
          {feature.emoji && <span>{feature.emoji} </span>}
          {feature.name || 'Feature Details'}
        </h2>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="detail-content">
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
        
        {feature.source && (
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', marginTop: '8px' }}>
            <Info size={14} /> {feature.source}
          </p>
        )}

        {feature.isInterpolated !== undefined && (
          <p className="data-integrity">
            {feature.isInterpolated ? '⚠️ Interpolated Position' : '✅ Verified GPS Ping'}
          </p>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;
