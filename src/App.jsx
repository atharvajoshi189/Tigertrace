import React, { useState, useEffect } from 'react';
import TrackingMap3D from './components/Map/TrackingMap3D';
import TopBar from './components/UI/TopBar';
import LeftNav from './components/UI/LeftNav';
import LayerPanel from './components/UI/LayerPanel';
import PlaybackPanel from './components/UI/PlaybackPanel';
import DetailPanel from './components/UI/DetailPanel';

function App() {
  const [mapStyle, setMapStyle] = useState('satellite');
  const [is3D, setIs3D] = useState(true);
  
  const [activeLayers, setActiveLayers] = useState({
    boundary: true,
    coreZone: true,
    tigers: true,
    trails: true,
    cameraTraps: true,
    gates: true,
    villages: true,
    waterBodies: true,
    heatmap: false
  });
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [timeBounds, setTimeBounds] = useState(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [appData, setAppData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [trackedAnimalId, setTrackedAnimalId] = useState('T-1'); // Default to single tracked animal (T-1)
  const [trackingMode, setTrackingMode] = useState('single'); // 'single' by default so not all animals track at same time

  const handleSelectFeature = (feat) => {
    setSelectedFeature(feat);
    if (feat && (feat.waypoints || feat.type === 'tiger' || feat.type === 'leopard' || feat.type === 'bear' || feat.type === 'dog' || feat.type === 'pangolin')) {
      setTrackedAnimalId(feat.id);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/data/demo_animals.json').then(r => r.json()),
      fetch('/data/demo_cameras.json').then(r => r.json()),
      fetch('/data/demo_waterbodies.json').then(r => r.json()),
      fetch('/data/simulation_time.json').then(r => r.json()),
      fetch('/data/tadoba_boundary.geojson').then(r => r.json()),
      fetch('/data/core_zone.geojson').then(r => r.json()),
      fetch('/data/safari_gates.geojson').then(r => r.json()),
      fetch('/data/villages.geojson').then(r => r.json())
    ]).then(([animals, cameras, waterBodies, simTime, boundary, coreZone, gates, villages]) => {
      setAppData({ animals, cameras, waterBodies, boundary, coreZone, gates, villages });
      setTimeBounds(simTime);
      setCurrentTime(simTime.end);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && timeBounds) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const nextTime = prev + (15 * 60 * 1000 * playbackSpeed);
          if (nextTime >= timeBounds.end) return timeBounds.start;
          return nextTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, timeBounds]);

  const toggleLayer = (layerName) => {
    setActiveLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  if (!appData || !timeBounds) {
    return <div style={{ color: 'var(--text-main)', padding: '20px', background: 'var(--bg-dark)' }}>Loading geospatial data...</div>;
  }

  return (
    <div className="app-container">
      <TopBar 
        mapStyle={mapStyle} 
        setMapStyle={setMapStyle} 
        is3D={is3D}
        setIs3D={setIs3D}
        appData={appData}
        setSelectedFeature={handleSelectFeature}
      />
      
      <div className="main-content">
        <LeftNav />

        <div className="map-wrapper">
          <TrackingMap3D 
            mapStyle={mapStyle}
            is3D={is3D}
            activeLayers={activeLayers}
            currentTime={currentTime}
            appData={appData}
            selectedFeature={selectedFeature}
            setSelectedFeature={handleSelectFeature}
            trackedAnimalId={trackedAnimalId}
            setTrackedAnimalId={setTrackedAnimalId}
            trackingMode={trackingMode}
            setTrackingMode={setTrackingMode}
          />

          <LayerPanel 
            activeLayers={activeLayers} 
            toggleLayer={toggleLayer} 
            appData={appData}
            trackedAnimalId={trackedAnimalId}
            setTrackedAnimalId={setTrackedAnimalId}
            trackingMode={trackingMode}
            setTrackingMode={setTrackingMode}
            setSelectedFeature={handleSelectFeature}
          />

          {selectedFeature && (
            <DetailPanel 
              feature={selectedFeature} 
              onClose={() => setSelectedFeature(null)} 
              onSelectFeature={handleSelectFeature}
              setTrackedAnimalId={setTrackedAnimalId}
              appData={appData}
            />
          )}

          <PlaybackPanel 
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            timeBounds={timeBounds}
          />

          {/* Reserve Overview Inset */}
          <div className="overview-inset">
            <div className="overview-map">
              <div className="overview-viewport"></div>
            </div>
            <span>Tadoba Reserve Overview</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
