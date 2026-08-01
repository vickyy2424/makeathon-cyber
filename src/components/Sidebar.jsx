import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Monitor, Network, Radio,
  ShieldAlert, EyeOff, Fingerprint, Link2,
  Shield, Bug, Briefcase,
  FileText, ScrollText, Settings,
  ChevronLeft, Activity
} from 'lucide-react';
import RadarLogo from './RadarLogo';

const sections = [
  {
    label: 'Monitoring',
    links: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/devices', icon: Monitor, label: 'Devices' },
      { to: '/network-map', icon: Network, label: 'Network Map' },
      { to: '/traffic', icon: Radio, label: 'Traffic Feed' },
    ]
  },
  {
    label: 'Detection',
    links: [
      { to: '/threats', icon: ShieldAlert, label: 'Threat Detection' },
      { to: '/hidden', icon: EyeOff, label: 'Hidden Activity' },
      { to: '/attribution', icon: Fingerprint, label: 'Device Attribution' },
      { to: '/killchain', icon: Link2, label: 'Kill Chain' },
    ]
  },
  {
    label: 'Defense',
    links: [
      { to: '/defense', icon: Shield, label: 'Active Defense' },
      { to: '/honeypot', icon: Bug, label: 'Honeypot' },
      { to: '/cases', icon: Briefcase, label: 'Cases' },
    ]
  },
  {
    label: 'Operations',
    links: [
      { to: '/reports', icon: FileText, label: 'Reports' },
      { to: '/logs', icon: ScrollText, label: 'Logs' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const [packetsPerSec, setPacketsPerSec] = useState(24350);
  const [threatLevel, setThreatLevel] = useState('ELEVATED');

  useEffect(() => {
    const interval = setInterval(() => {
      setPacketsPerSec(prev => prev + Math.floor(Math.random() * 200 - 100));
      setThreatLevel(prev => {
        const levels = ['LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL'];
        const idx = levels.indexOf(prev);
        const delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return levels[Math.max(0, Math.min(4, idx + delta))];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const threatColors = {
    LOW: '#00e676', MODERATE: '#00e5ff', ELEVATED: '#ff9100', HIGH: '#ff9100', CRITICAL: '#ff1744'
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 220 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col"
      style={{ background: '#0a0914', borderRight: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 flex items-center justify-between">
        {!collapsed && <RadarLogo size={40} />}
        {collapsed && (
          <div className="mx-auto">
            <svg width={28} height={28} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,229,255,0.2)" strokeWidth="2" />
              <circle cx="50" cy="50" r="4" fill="#00e5ff">
                <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
              </circle>
              <line x1="50" y1="50" x2="50" y2="12" stroke="#00e5ff" strokeWidth="2" className="radar-sweep" />
            </svg>
          </div>
        )}
        <button 
          onClick={onToggle} 
          className="text-cyber-muted hover:text-cyber-cyan transition-colors"
          style={{ display: collapsed ? 'none' : 'block' }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {sections.map(section => (
          <div key={section.label} className="mb-1">
            {!collapsed && <div className="section-label">{section.label}</div>}
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon size={18} style={{ flexShrink: 0 }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Status */}
      {!collapsed && (
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="live-dot" />
            <span className="text-[11px] font-semibold text-cyber-green font-space">LIVE ENGINE</span>
          </div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-cyber-muted">Packets/s</span>
            <span className="font-mono text-cyber-text">{packetsPerSec.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-cyber-muted">Threat Level</span>
            <span className="font-mono font-semibold" style={{ color: threatColors[threatLevel] }}>
              {threatLevel}
            </span>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
