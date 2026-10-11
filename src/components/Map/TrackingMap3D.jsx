import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
import { Camera, Home, Droplets } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

// Base map style using MapLibre with 3D terrain
const createMapStyle = (styleType) => {
  const isSatellite = styleType === 'satellite' || styleType === 'hybrid';
  const isTerrain = styleType === 'terrain';
  
  return {
    version: 8,
    sources: {
      'satellite': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256
      },
      'street': {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256
      },
      'terrain-tile': {
        type: 'raster',
        tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
        tileSize: 256
      },
      'terrain-dem': {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 14
      }
    },
    layers: [
      {
        id: 'base-layer',
        type: 'raster',
        source: isSatellite ? 'satellite' : (isTerrain ? 'terrain-tile' : 'street'),
        paint: {
          'raster-saturation': 0.15,
          'raster-contrast': 0.1,
          'raster-brightness-max': 0.9,
          'raster-fade-duration': 0
        }
      }
    ],
    terrain: {
      source: 'terrain-dem',
      exaggeration: 1.4
    }
  };
};

const getPositionAtTime = (waypoints, time) => {
  if (!waypoints || waypoints.length === 0) return null;
  const past = waypoints.filter(w => w.time <= time);
  if (past.length === 0) return waypoints[0];
  const current = past[past.length - 1];
  
  const future = waypoints.filter(w => w.time > time);
  if (future.length === 0) return current;

  const next = future[0];
  const timeDiff = next.time - current.time;
  const progress = (time - current.time) / timeDiff;

  return {
    lat: current.lat + (next.lat - current.lat) * progress,
    lng: current.lng + (next.lng - current.lng) * progress,
    time,
    isInterpolated: progress > 0
  };
};

const TrackingMap3D = ({ mapStyle, is3D, activeLayers, currentTime, appData, selectedFeature, setSelectedFeature, trackedAnimalId, setTrackedAnimalId, trackingMode = 'single' }) => {
  const mapRef = useRef();
  
  const mapboxStyle = useMemo(() => createMapStyle(mapStyle), [mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    map.on('idle', () => {
      const layers = map.getStyle().layers;
      console.log('MapLibre Layers:', layers.map(l => l.id));
    });
  }, []);

  useEffect(() => {
    if (selectedFeature && mapRef.current) {
      const map = mapRef.current.getMap();
      
      let targetLng, targetLat;
      if (selectedFeature.geometry && selectedFeature.geometry.type === 'Point') {
        targetLng = selectedFeature.geometry.coordinates[0];
        targetLat = selectedFeature.geometry.coordinates[1];
      } else if (selectedFeature.pos) { // For waterbodies
        targetLng = selectedFeature.pos[1];
        targetLat = selectedFeature.pos[0];
      } else if (selectedFeature.lat && selectedFeature.lng) { // For animals/interpolated
        targetLng = selectedFeature.lng;
        targetLat = selectedFeature.lat;
      } else if (selectedFeature.latitude && selectedFeature.longitude) {
        targetLng = selectedFeature.longitude;
        targetLat = selectedFeature.latitude;
      } else if (selectedFeature.waypoints && selectedFeature.waypoints.length > 0) {
        const wp = getPositionAtTime(selectedFeature.waypoints, currentTime) || selectedFeature.waypoints[0];
        targetLng = wp.lng;
        targetLat = wp.lat;
      }
      
      if (targetLng && targetLat) {
        map.flyTo({
          center: [targetLng, targetLat],
          zoom: 13,
          pitch: is3D ? 60 : 0,
          speed: 1.2,
          curve: 1
        });
      }
    }
  }, [selectedFeature, is3D]);

  // Center map on newly tracked animal when trackedAnimalId changes
  useEffect(() => {
    if (mapRef.current && trackedAnimalId && allAnimals && allAnimals.length > 0) {
      const anim = allAnimals.find(a => a.id === trackedAnimalId);
      if (anim && anim.waypoints && anim.waypoints.length > 0) {
        const wp = getPositionAtTime(anim.waypoints, currentTime) || anim.waypoints[0];
        if (wp) {
          const map = mapRef.current.getMap();
          map.flyTo({
            center: [wp.lng, wp.lat],
            zoom: 12.5,
            pitch: is3D ? 55 : 0,
            speed: 1.1,
            curve: 1
          });
        }
      }
    }
  }, [trackedAnimalId, is3D]);

  const { animals, cameras, boundary, coreZone, gates, villages, waterBodies } = appData;
  
  const boundaryLine = useMemo(() => {
    if(!boundary || !boundary.features[0]) return null;
    const coords = boundary.features[0].geometry.type === 'Polygon' ? boundary.features[0].geometry.coordinates[0] : boundary.features[0].geometry.coordinates[0][0];
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] };
  }, [boundary]);

  const coreLine = useMemo(() => {
    if(!coreZone || !coreZone.features[0]) return null;
    const coords = coreZone.features[0].geometry.type === 'Polygon' ? coreZone.features[0].geometry.coordinates[0] : coreZone.features[0].geometry.coordinates[0][0];
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] };
  }, [coreZone]);

  const allAnimals = useMemo(() => [
    ...(animals.tigers || []), 
    ...(animals.leopards || []),
    ...(animals.slothBears || []),
    ...(animals.wildDogs || []),
    ...(animals.pangolins || [])
  ], [animals]);

  const activeTrackedAnimal = useMemo(() => {
    return allAnimals.find(a => 
      trackedAnimalId ? a.id === trackedAnimalId : (selectedFeature?.id === a.id || a.id === 'T-1')
    ) || allAnimals[0];
  }, [allAnimals, trackedAnimalId, selectedFeature]);

  const activeSightings = useMemo(() => {
    if (!activeTrackedAnimal || !activeTrackedAnimal.sightings) return [];
    return activeTrackedAnimal.sightings.filter(s => s.time <= currentTime);
  }, [activeTrackedAnimal, currentTime]);

  const heatmapData = useMemo(() => {
    const points = [];
    allAnimals.forEach(animal => {
      if(animal.waypoints) {
        animal.waypoints.forEach(wp => {
          points.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
            properties: { weight: 1 }
          });
        });
      }
    });
    return { type: 'FeatureCollection', features: points };
  }, [allAnimals]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        pitch: is3D ? 60 : 0,
        bearing: is3D ? -10 : 0,
        duration: 1000
      });
    }
  }, [is3D]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: 79.35,
        latitude: 20.3,
        zoom: 11,
        pitch: is3D ? 60 : 0,
        bearing: is3D ? -10 : 0
      }}
      mapStyle={mapboxStyle}
      style={{ width: '100%', height: '100%' }}
      maxPitch={85}
      terrain={{source: 'terrain-dem', exaggeration: 1.5}}
    >
      <NavigationControl position="bottom-right" visualizePitch={true} />

      {/* Boundary */}
      {activeLayers.boundary && boundary && (
        <>
          <Source id="boundary-fill-src" type="geojson" data={boundary}>
            <Layer id="boundary-fill" source="boundary-fill-src" type="fill" paint={{ 'fill-color': '#10b981', 'fill-opacity': 0.05 }} />
          </Source>
          {boundaryLine && (
            <Source id="boundary-line-src" type="geojson" data={boundaryLine}>
              <Layer id="boundary-line" source="boundary-line-src" type="line" paint={{ 'line-color': '#10b981', 'line-width': 2, 'line-opacity': 0.8 }} />
            </Source>
          )}
        </>
      )}

      {/* Core Zone */}
      {activeLayers.coreZone && coreZone && (
        <>
          <Source id="core-fill-src" type="geojson" data={coreZone}>
            <Layer id="core-fill" source="core-fill-src" type="fill" paint={{ 'fill-color': '#f59e0b', 'fill-opacity': 0.1 }} />
          </Source>
          {coreLine && (
            <Source id="core-line-src" type="geojson" data={coreLine}>
              <Layer id="core-line" source="core-line-src" type="line" paint={{ 'line-color': '#f59e0b', 'line-width': 1.5, 'line-opacity': 0.9 }} />
            </Source>
          )}
        </>
      )}

      {/* Heatmap */}
      {activeLayers.heatmap && (
        <Source id="heatmap-source" type="geojson" data={heatmapData}>
          <Layer
            id="heatmap-layer"
            source="heatmap-source"
            type="heatmap"
            paint={{
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(33,102,172,0)',
                0.2, 'rgb(103,169,207)',
                0.5, 'rgb(209,229,240)',
                0.8, 'rgb(253,219,199)',
                1, 'rgb(178,24,43)'
              ],
              'heatmap-radius': 25,
              'heatmap-opacity': 0.8
            }}
          />
        </Source>
      )}

      {/* Animal Trails (Lines) */}
      {activeLayers.trails && allAnimals.map(animal => {
        // In single mode (default), only render trail for the active tracked animal
        const isTracked = trackingMode === 'all' 
          ? true 
          : (trackedAnimalId ? animal.id === trackedAnimalId : (selectedFeature ? selectedFeature.id === animal.id : animal.id === 'T-1'));
        if (!isTracked) return null;

        const pastWp = animal.waypoints ? animal.waypoints.filter(w => w.time <= currentTime).map(w => [w.lng, w.lat]) : [];
        if (pastWp.length < 2) return null;
        
        let color = '#f97316'; // Vivid Tiger orange
        if (animal.type === 'leopard') color = '#eab308'; // Leopard gold
        if (animal.type === 'bear') color = '#a855f7'; // Sloth bear purple
        if (animal.type === 'dog') color = '#ef4444'; // Wild dog red
        if (animal.type === 'pangolin') color = '#06b6d4'; // Pangolin cyan
        
        const isSelected = selectedFeature && selectedFeature.id === animal.id;
        const width = isSelected ? 4.5 : 3.2;
        const opacity = isSelected ? 1.0 : 0.95;

        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: pastWp }
        };

        return (
          <Source key={`trail-${animal.id}`} id={`trail-source-${animal.id}`} type="geojson" data={geojson}>
            <Layer 
              id={`trail-line-${animal.id}`} 
              source={`trail-source-${animal.id}`}
              type="line" 
              paint={{ 
                'line-color': color, 
                'line-width': width, 
                'line-opacity': opacity,
                'line-dasharray': [3, 2]
              }} 
            />
          </Source>
        );
      })}

      {/* Camera Trap Sighting Pins along Tracked Animal Trail */}
      {activeLayers.trails && activeSightings.map((s, idx) => {
        const isSelectedSighting = selectedFeature && (selectedFeature.sightingId === s.sightingId || (selectedFeature.type === 'sighting' && selectedFeature.timestamp === s.time));

        return (
          <Marker
            key={`trail-sighting-${activeTrackedAnimal?.id}-${s.sightingId || idx}`}
            longitude={s.pos[1]}
            latitude={s.pos[0]}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFeature({
                emoji: '📸',
                name: `${activeTrackedAnimal.name} @ ${s.cameraName}`,
                type: 'sighting',
                category: 'Camera Trap Sighting',
                sightingId: s.sightingId,
                animalId: activeTrackedAnimal.id,
                animalName: activeTrackedAnimal.name,
                animalType: activeTrackedAnimal.type,
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
            }}
          >
            <div
              className="sighting-trail-badge"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isSelectedSighting ? '28px' : '24px',
                height: isSelectedSighting ? '28px' : '24px',
                borderRadius: '50%',
                background: isSelectedSighting ? '#8b5cf6' : 'rgba(15, 23, 42, 0.92)',
                border: isSelectedSighting ? '2.5px solid #ffffff' : '2px solid #8b5cf6',
                boxShadow: isSelectedSighting 
                  ? '0 0 16px #8b5cf6, 0 4px 10px rgba(0,0,0,0.8)' 
                  : '0 0 10px rgba(139, 92, 246, 0.7), 0 3px 6px rgba(0,0,0,0.7)',
                cursor: 'pointer',
                transform: isSelectedSighting ? 'scale(1.25)' : 'scale(1)',
                transition: 'all 0.2s ease-out'
              }}
              title={`📸 Camera Sighting: ${activeTrackedAnimal?.name} captured at ${s.cameraName} (${new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
            >
              <Camera size={12} color="#ffffff" strokeWidth={2.4} />
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: '#10b981',
                color: '#ffffff',
                borderRadius: '50%',
                width: '9px',
                height: '9px',
                fontSize: '6px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #0f172a'
              }}>
                ✓
              </span>
            </div>
          </Marker>
        );
      })}

      {/* Animal Markers */}
      {activeLayers.tigers && allAnimals.map(animal => {
        // In single mode (default), only render the active tracked animal marker!
        const isTracked = trackingMode === 'all' 
          ? true 
          : (trackedAnimalId ? animal.id === trackedAnimalId : (selectedFeature ? selectedFeature.id === animal.id : animal.id === 'T-1'));
        if (!isTracked) return null;

        const wp = getPositionAtTime(animal.waypoints, currentTime);
        if (!wp) return null;

        let emoji = '🐅';
        let speciesColor = '#f97316';
        if (animal.type === 'leopard') { emoji = '🐆'; speciesColor = '#eab308'; }
        if (animal.type === 'bear') { emoji = '🐻'; speciesColor = '#a855f7'; }
        if (animal.type === 'dog') { emoji = '🦊'; speciesColor = '#ef4444'; }
        if (animal.type === 'pangolin') { emoji = '🦎'; speciesColor = '#06b6d4'; }

        const isSelected = selectedFeature && selectedFeature.id === animal.id;

        return (
          <Marker 
            key={`marker-${animal.id}`} 
            longitude={wp.lng} 
            latitude={wp.lat}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFeature({ ...animal, emoji, timestamp: wp.time, source: 'GPS Collar' });
              if (setTrackedAnimalId) setTrackedAnimalId(animal.id);
            }}
          >
            <div 
              className="animal-marker-pin" 
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isSelected ? speciesColor : 'rgba(15, 23, 42, 0.9)',
                border: isTracked ? `2.5px solid #ffffff` : `2px solid ${speciesColor}`,
                boxShadow: isTracked 
                  ? `0 0 16px ${speciesColor}, 0 4px 10px rgba(0,0,0,0.8)` 
                  : `0 0 8px ${speciesColor}66, 0 4px 6px rgba(0,0,0,0.6)`,
                transform: isTracked ? 'scale(1.3)' : 'scale(1)',
                transition: 'all 0.2s ease-out',
                cursor: 'pointer',
                fontSize: '15px'
              }}
              title={`${animal.name || animal.id} (${animal.type}) ${isTracked ? '- Currently Tracked' : ''}`}
            >
              {emoji}
              {isTracked && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 0 8px #22c55e'
                }} />
              )}
            </div>
          </Marker>
        );
      })}

      {/* Gates */}
      {activeLayers.gates && gates && gates.features.map((gate, i) => {
        const isCore = gate.properties.zone === 'Core';
        const isSelected = selectedFeature && selectedFeature.id === gate.properties.id;
        const gateColor = isCore ? '#f59e0b' : '#10b981';

        return (
          <Marker 
            key={`gate-${i}`} 
            longitude={gate.geometry.coordinates[0]} 
            latitude={gate.geometry.coordinates[1]}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFeature({ emoji: '⛩️', ...gate.properties, geometry: gate.geometry });
            }}
          >
            <div 
              className="gate-marker-pin"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isCore ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)',
                border: isSelected ? '2.5px solid #ffffff' : '2px solid rgba(255,255,255,0.85)',
                boxShadow: isSelected ? `0 0 14px ${gateColor}, 0 4px 10px rgba(0,0,0,0.6)` : '0 4px 10px rgba(0,0,0,0.6)',
                cursor: 'pointer',
                transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                transition: 'all 0.2s ease-out'
              }}
              title={gate.properties.name}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18"/>
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                <path d="M9 21v-8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8"/>
              </svg>
            </div>
          </Marker>
        );
      })}

      {/* Villages */}
      {activeLayers.villages && villages && villages.features.map((v, i) => (
        <Marker 
          key={`village-${i}`} 
          longitude={v.geometry.coordinates[0]} 
          latitude={v.geometry.coordinates[1]}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedFeature({ emoji: '🏠', ...v.properties, source: 'Settlement Data' });
          }}
        >
          <div 
            className="village-marker-pin"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #64748b, #475569)',
              border: '1.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 3px 6px rgba(0,0,0,0.5)',
              cursor: 'pointer'
            }}
            title={v.properties.name}
          >
            <Home size={13} color="#ffffff" strokeWidth={2.2} />
          </div>
        </Marker>
      ))}

      {/* Water Bodies */}
      {activeLayers.waterBodies && waterBodies && waterBodies.map((wb, i) => (
        <Marker 
          key={`wb-${i}`} 
          longitude={wb.pos[1]} 
          latitude={wb.pos[0]}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedFeature({ emoji: '💧', name: wb.name, category: 'Water Source', radius: wb.radius, source: 'Survey Data' });
          }}
        >
          <div 
            className="water-marker-pin"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              border: '1.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
              cursor: 'pointer'
            }}
            title={wb.name}
          >
            <Droplets size={13} color="#ffffff" strokeWidth={2.2} />
          </div>
        </Marker>
      ))}

      {/* Cameras */}
      {activeLayers.cameraTraps && cameras.map((c, i) => {
        const isSelected = selectedFeature && selectedFeature.id === c.id;
        const animalSighting = activeTrackedAnimal?.sightings?.find(s => s.cameraId === c.id && s.time <= currentTime);

        return (
          <Marker 
            key={`cam-${i}`} 
            longitude={c.pos[1]} 
            latitude={c.pos[0]}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFeature({ emoji: '📷', name: c.name, category: 'Camera Trap', source: 'Station Data', id: c.id, ...c });
            }}
          >
            <div 
              className="camera-marker-pin"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: animalSighting ? '28px' : '26px',
                height: animalSighting ? '28px' : '26px',
                borderRadius: '50%',
                background: animalSighting 
                  ? 'linear-gradient(135deg, #a855f7, #7c3aed)' 
                  : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                border: isSelected 
                  ? '2.5px solid #ffffff' 
                  : (animalSighting ? '2px solid #34d399' : '1.5px solid rgba(255,255,255,0.85)'),
                boxShadow: isSelected 
                  ? '0 0 14px #8b5cf6, 0 4px 8px rgba(0,0,0,0.6)' 
                  : (animalSighting ? '0 0 12px rgba(52, 211, 153, 0.8), 0 4px 8px rgba(0,0,0,0.6)' : '0 4px 8px rgba(0,0,0,0.55)'),
                cursor: 'pointer',
                transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                transition: 'all 0.2s ease-out'
              }}
              title={animalSighting 
                ? `${c.name} (${c.status}) - Photographed ${activeTrackedAnimal.name} at ${new Date(animalSighting.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : `${c.name} (${c.status})`}
            >
              <Camera size={13} color="#ffffff" strokeWidth={2.2} />
              {animalSighting && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#34d399',
                  border: '1.5px solid #0f172a',
                  boxShadow: '0 0 8px #34d399'
                }} />
              )}
              {!animalSighting && c.status === 'Online' && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '1.5px solid #1e1b4b',
                  boxShadow: '0 0 6px #22c55e'
                }} />
              )}
            </div>
          </Marker>
        );
      })}
    </Map>
  );
};

export default TrackingMap3D;
