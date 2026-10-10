import React, { useState, useEffect } from 'react';
import TrackingMap from './components/Map/TrackingMap';
import TopBar from './components/UI/TopBar';
import PlaybackPanel from './components/UI/PlaybackPanel';
import DetailPanel from './components/UI/DetailPanel';
import 'leaflet/dist/leaflet.css';

function App() {
  const [mapStyle, setMapStyle] = useState('street');
  
  const [activeLayers, setActiveLayers] = useState({
    boundary: true,
    coreZone: true,
    tigers: true,
    leopards: false,
    trails: true,
    cameraTraps: true,
    waterBodies: false,
    heatmap: false,
    gates: true,
    villages: true
  });
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [timeBounds, setTimeBounds] = useState(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0.8);
  const [appData, setAppData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

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
      setCurrentTime(simTime.start);
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
    return <div style={{ color: 'white', padding: '20px' }}>Loading geospatial data...</div>;
  }

  return (
    <div className="app-container">
      <TopBar 
        mapStyle={mapStyle} 
        setMapStyle={setMapStyle} 
        activeLayers={activeLayers}
        toggleLayer={toggleLayer}
      />
      
      <div className="map-wrapper">
        <TrackingMap 
          mapStyle={mapStyle}
          activeLayers={activeLayers}
          currentTime={currentTime}
          overlayOpacity={overlayOpacity}
          appData={appData}
          setSelectedFeature={setSelectedFeature}
        />

        {selectedFeature && (
          <DetailPanel 
            feature={selectedFeature} 
            onClose={() => setSelectedFeature(null)} 
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
      </div>
    </div>
  );
}

export default App;
