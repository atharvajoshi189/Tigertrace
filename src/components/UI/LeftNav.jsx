import React from 'react';
import { Map, Activity, MapPin, Home, Radar, Camera, BarChart2, Settings } from 'lucide-react';

const NavItem = ({ icon, label, active }) => (
  <button className={`nav-item ${active ? 'active' : ''}`} title={label}>
    {icon}
    <span>{label}</span>
  </button>
);

const LeftNav = () => {
  return (
    <div className="left-nav-rail">
      <NavItem icon={<Map size={20} />} label="Map" active={true} />
      <NavItem icon={<Activity size={20} />} label="Animals" />
      <NavItem icon={<MapPin size={20} />} label="Safari Gates" />
      <NavItem icon={<Home size={20} />} label="Villages" />
      <NavItem icon={<Radar size={20} />} label="Monitoring" />
      <NavItem icon={<Camera size={20} />} label="Camera Traps" />
      <NavItem icon={<BarChart2 size={20} />} label="Analytics" />
      <div style={{ flexGrow: 1 }} />
      <NavItem icon={<Settings size={20} />} label="Settings" />
    </div>
  );
};

export default LeftNav;
