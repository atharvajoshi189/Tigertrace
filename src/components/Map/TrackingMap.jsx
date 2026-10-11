import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Polyline, Circle, CircleMarker, Tooltip, useMapEvents, useMap, ScaleControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

// Custom icons
const createIcon = (color) => L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const createDirectionalIcon = (color, heading) => L.divIcon({
  className: 'custom-icon-directional',
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); position: relative; transform: rotate(${heading}deg);">
          <div style="position: absolute; top: -6px; left: 4px; width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 6px solid ${color};"></div>
         </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const createCameraIcon = () => L.divIcon({
  className: 'camera-icon',
  html: `<div style="background-color: #f59e0b; width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const createEmojiIcon = (emoji, color) => L.divIcon({
  className: 'emoji-icon',
  html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">${emoji}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const tigerIcon = createEmojiIcon('🐅', '#ef4444');
const leopardIcon = createEmojiIcon('🐆', '#eab308');
const bearIcon = createEmojiIcon('🐻', '#8b5cf6');
const dogIcon = createEmojiIcon('🦊', '#f97316');
const pangolinIcon = createEmojiIcon('🦎', '#10b981');
const cameraIcon = createCameraIcon();

// Helper to fit bounds to geojson
const MapFitter = ({ geoData }) => {
  const map = useMap();
  useEffect(() => {
    if (geoData) {
      const layer = L.geoJSON(geoData);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [geoData, map]);
  return null;
};

// Component to track zoom and show/hide detail
const ZoomHandler = ({ setZoomLevel }) => {
  useMapEvents({
    zoomend: (e) => {
      setZoomLevel(e.target.getZoom());
    }
  });
  return null;
};

// Component to show coordinates on mouse move
const CoordinateDisplay = () => {
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  useMapEvents({
    mousemove: (e) => {
      setCoords(e.latlng);
    }
  });
  return (
    <div className="coordinate-display">
      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
    </div>
  );
};

const TrackingMap = ({ mapStyle, activeLayers, currentTime, overlayOpacity, appData, setSelectedFeature, trackedAnimalId, setTrackedAnimalId, trackingMode = 'single' }) => {
  const { animals: { tigers, leopards, slothBears = [], wildDogs = [], pangolins = [] }, cameras, waterBodies, boundary, coreZone, gates, villages } = appData;
  const [zoomLevel, setZoomLevel] = useState(11);


  const tileProviders = {
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map style: &copy; OpenTopoMap'
    },
    hybrid: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri'
    }
  };

  const getPositionAtTime = (waypoints, targetTime) => {
    // Find the closest waypoint before or exactly at targetTime
    let closest = waypoints[0];
    for(let i = 0; i < waypoints.length; i++) {
      if (waypoints[i].time <= targetTime) {
        closest = waypoints[i];
      } else {
        break;
      }
    }
    return closest;
  };

  const getHistoricalTrail = (waypoints, targetTime) => {
    return waypoints.filter(wp => wp.time <= targetTime).map(wp => [wp.lat, wp.lng]);
  };

  const renderAnimal = (animal, color, currentZoom) => {
    const isTracked = (trackingMode === 'all' || (trackedAnimalId ? animal.id === trackedAnimalId : animal.id === 'T-1'));
    if (!isTracked) return null;

    const currentWp = getPositionAtTime(animal.waypoints, currentTime);
    if (!currentWp) return null;
    const trail = getHistoricalTrail(animal.waypoints, currentTime);
    
    let icon = tigerIcon;
    let emoji = '🐅';
    let typeName = 'Tiger';
    if (animal.type === 'leopard') { icon = leopardIcon; emoji = '🐆'; typeName = 'Leopard'; }
    if (animal.type === 'bear') { icon = bearIcon; emoji = '🐻'; typeName = 'Sloth Bear'; }
    if (animal.type === 'dog') { icon = dogIcon; emoji = '🦊'; typeName = 'Wild Dog'; }
    if (animal.type === 'pangolin') { icon = pangolinIcon; emoji = '🦎'; typeName = 'Pangolin'; }

    return (
      <React.Fragment key={animal.id}>
        {/* Historical trail */}
        {activeLayers.trails && trail.length > 1 && (trackingMode === 'all' || (trackedAnimalId ? animal.id === trackedAnimalId : animal.id === 'T-1')) && (
          <Polyline 
            positions={trail} 
            color={color} 
            weight={3} 
            opacity={0.85 * overlayOpacity} 
            dashArray="6, 6"
          />
        )}

        {/* Camera Trap Sightings along Trail */}
        {activeLayers.trails && (trackingMode === 'all' || (trackedAnimalId ? animal.id === trackedAnimalId : animal.id === 'T-1')) && animal.sightings && animal.sightings.filter(s => s.time <= currentTime).map((s, idx) => (
          <CircleMarker
            key={`sighting-${animal.id}-${idx}`}
            center={s.pos}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: '#8b5cf6',
              fillOpacity: 1
            }}
            eventHandlers={{
              click: () => {
                setSelectedFeature({
                  emoji: '📸',
                  name: `${animal.name} @ ${s.cameraName}`,
                  type: 'sighting',
                  category: 'Camera Trap Sighting',
                  sightingId: s.sightingId,
                  animalId: animal.id,
                  animalName: animal.name,
                  animalType: animal.type,
                  cameraId: s.cameraId,
                  cameraName: s.cameraName,
                  pos: s.pos,
                  timestamp: s.time,
                  image: s.image,
                  confidence: s.confidence,
                  behavior: s.behavior,
                  notes: s.notes,
                  source: 'Automated Motion Trap'
                });
              }
            }}
          >
            <Tooltip permanent={false} direction="top">
              📸 {animal.name} @ {s.cameraName}
            </Tooltip>
          </CircleMarker>
        ))}
        
        {/* Current position */}
        <Marker 
          position={[currentWp.lat, currentWp.lng]} 
          icon={icon}
          eventHandlers={{
            click: () => {
              setSelectedFeature({
                ...animal,
                emoji,
                timestamp: currentWp.time,
                isInterpolated: currentWp.isInterpolated,
                source: currentWp.isInterpolated ? 'Interpolated Location' : 'Verified GPS Ping'
              });
              if (setTrackedAnimalId) setTrackedAnimalId(animal.id);
            }
          }}
        >
        </Marker>
      </React.Fragment>
    );
  };

  const tadobaBounds = [
    [19.5, 78.5],
    [21.0, 80.5]
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer 
        center={[20.25, 79.33]} 
        zoom={11} 
        minZoom={9}
        maxBounds={tadobaBounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false}
      >
        <ZoomHandler setZoomLevel={setZoomLevel} />
        <CoordinateDisplay />
        <ScaleControl position="bottomright" />

        <TileLayer
          key={mapStyle} 
          url={tileProviders[mapStyle].url}
          attribution={tileProviders[mapStyle].attribution}
        />
        {mapStyle === 'hybrid' && (
          <TileLayer
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png"
            attribution="Stamen Design / OSM"
          />
        )}

        {boundary && activeLayers.boundary && (
          <GeoJSON 
            data={boundary} 
            style={{
              color: '#10b981',
              weight: 1,
              fillColor: '#10b981', // Light green buffer look
              fillOpacity: 0.05 * overlayOpacity,
              dashArray: '4, 8'
            }}
          />
        )}
        
        {coreZone && activeLayers.coreZone && (
          <GeoJSON 
            data={coreZone} 
            style={{
              color: '#059669',
              weight: 2,
              fillColor: '#059669', // Dark green core look
              fillOpacity: 0.15 * overlayOpacity
            }}
            onEachFeature={(feature, layer) => {
              layer.bindTooltip('Core Zone', { permanent: zoomLevel >= 10, direction: 'center', className: 'zone-label' });
            }}
          />
        )}

        {boundary && <MapFitter geoData={boundary} />}

        {/* Safari Gates */}
        {activeLayers.gates && gates && (
          <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
            <GeoJSON 
              data={gates} 
              pointToLayer={(feature, latlng) => {
                const isCore = feature.properties.zone === 'Core';
                const fillColor = isCore ? '#f59e0b' : '#10b981'; // Amber for Core, Emerald for Buffer
                return L.circleMarker(latlng, { radius: 6, fillColor, color: '#121814', weight: 2, fillOpacity: 1 });
              }}
              onEachFeature={(feature, layer) => {
                layer.on('click', () => {
                  setSelectedFeature({
                    emoji: '🏕️',
                    ...feature.properties,
                    geometry: feature.geometry
                  });
                });
              }}
            />
          </MarkerClusterGroup>
        )}

        {/* Villages */}
        {activeLayers.villages && zoomLevel >= 10 && villages && (
          <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
            <GeoJSON 
              data={villages} 
              pointToLayer={(feature, latlng) => L.circleMarker(latlng, { radius: 5, fillColor: '#9ca3af', color: '#121814', weight: 1, fillOpacity: 1 })}
              onEachFeature={(feature, layer) => {
                layer.bindTooltip(feature.properties.name, { permanent: zoomLevel >= 11, direction: 'top' });
                layer.on('click', () => {
                  setSelectedFeature({
                    emoji: '🏠',
                    ...feature.properties
                  });
                });
              }}
            />
          </MarkerClusterGroup>
        )}

        {/* Water Bodies Analysis (Progressive Detail) */}
        {activeLayers.waterBodies && zoomLevel >= 10 && waterBodies.map(wb => (
          <Circle 
            key={wb.id} 
            center={wb.pos} 
            radius={wb.radius} 
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3 * overlayOpacity }}
          >
            <Tooltip>{wb.name}</Tooltip>
          </Circle>
        ))}

        {/* Sightings Heatmap (ProgressDetail) */}
        {activeLayers.heatmap && zoomLevel >= 9 && [tigers, leopards, slothBears, wildDogs, pangolins].flat().map(animal => 
          animal.waypoints.map((wp, i) => {
            let heatColor = '#ef4444';
            if (animal.type === 'leopard') heatColor = '#eab308';
            if (animal.type === 'bear') heatColor = '#8b5cf6';
            if (animal.type === 'dog') heatColor = '#f97316';
            if (animal.type === 'pangolin') heatColor = '#10b981';
            
            return (
              <Circle 
                key={`${animal.id}-heat-${i}`}
                center={[wp.lat, wp.lng]}
                radius={800}
                pathOptions={{
                  stroke: false,
                  fillColor: heatColor,
                  fillOpacity: 0.1 * overlayOpacity
                }}
              />
            );
          })
        )}

        {/* Live Trackers */}
        {activeLayers.tigers && tigers.map(t => renderAnimal(t, '#ef4444', zoomLevel))}
        {activeLayers.leopards && leopards.map(l => renderAnimal(l, '#eab308', zoomLevel))}
        {activeLayers.tigers && slothBears.map(b => renderAnimal(b, '#8b5cf6', zoomLevel))}
        {activeLayers.tigers && wildDogs.map(d => renderAnimal(d, '#f97316', zoomLevel))}
        {activeLayers.tigers && pangolins.map(p => renderAnimal(p, '#10b981', zoomLevel))}

        {/* Camera Traps - Progressive Detail */}
        {activeLayers.cameraTraps && zoomLevel >= 10 && (
          <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
            {cameras.map(c => (
              <Marker 
                key={c.id} 
                position={c.pos} 
                icon={cameraIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedFeature({
                      emoji: '📷',
                      name: c.name,
                      id: c.id,
                      category: 'Camera Trap',
                      source: 'Station Data',
                      zone: 'Reserve',
                      ...c
                    });
                  }
                }}
              >
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
