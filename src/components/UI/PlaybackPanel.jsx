import React from 'react';
import { Play, Pause, FastForward } from 'lucide-react';

const PlaybackPanel = ({ isPlaying, setIsPlaying, currentTime, setCurrentTime, playbackSpeed, setPlaybackSpeed, timeBounds }) => {
  const duration = timeBounds.end - timeBounds.start;

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setCurrentTime(timeBounds.start + (duration * percentage));
  };

  const progressPercentage = ((currentTime - timeBounds.start) / duration) * 100;
  
  const timeStr = new Date(currentTime).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
  });

  const toggleSpeed = () => {
    setPlaybackSpeed(prev => prev === 1 ? 5 : prev === 5 ? 10 : 1);
  };

  return (
    <div className="playback-floating">
      <button className="play-btn" onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? <Pause size={20} /> : <Play size={20} style={{marginLeft: '2px'}} />}
      </button>

      <div className="timeline-container">
        <div className="timeline-labels">
          <span>{new Date(timeBounds.start).toLocaleDateString()}</span>
          <span>{new Date(timeBounds.end).toLocaleDateString()}</span>
        </div>
        <div className="timeline-track" onClick={handleTimelineClick}>
          <div className="timeline-progress" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      <div className="current-time">
        {timeStr}
      </div>

      <button className="dropdown-btn" onClick={toggleSpeed} title="Playback Speed">
        <FastForward size={16} /> {playbackSpeed}x
      </button>
    </div>
  );
};

export default PlaybackPanel;
