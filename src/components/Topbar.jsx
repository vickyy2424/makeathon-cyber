import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Zap, ChevronDown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateAttack } from '../utils/api';
import { getSocket } from '../utils/api';
import toast from 'react-hot-toast';

const pageNames = {
  '/': 'SOC Dashboard', '/devices': 'Devices', '/network-map': 'Network Map',
  '/traffic': 'Traffic Feed', '/threats': 'Threat Detection', '/hidden-activity': 'Hidden Activity',
  '/device-attribution': 'Device Attribution', '/kill-chain': 'Kill Chain',
  '/active-defense': 'Active Defense', '/honeypot': 'AI Honeypot',
  '/cases': 'Investigation Cases', '/reports': 'Reports', '/logs': 'System Logs', '/settings': 'Settings',
};

const ATTACKS = ['Port Scan','Brute Force SSH','DNS Tunneling','C2 Beacon','Data Exfiltration','DDoS Flood','Ransomware','ARP Spoofing'];
const ATTACK_COLORS = {
  'Port Scan':'#7c4dff','Brute Force SSH':'#ff9100','DNS Tunneling':'#e040fb',
  'C2 Beacon':'#ff1744','Data Exfiltration':'#ff1744','DDoS Flood':'#ff1744',
  'Ransomware':'#ff1744','ARP Spoofing':'#ff9100',
};

const Topbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [selectedAttack, setSelectedAttack] = useState('Port Scan');
  const [showDropdown, setShowDropdown] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [alertCount] = useState(7);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await simulateAttack(selectedAttack);
      toast.custom((t) => (
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          className="glass-card px-5 py-3 flex items-center gap-3 min-w-[320px]"
          style={{ border: `1px solid ${ATTACK_COLORS[selectedAttack]}40`, background: '#15141f' }}>
          <Zap size={18} style={{ color: ATTACK_COLORS[selectedAttack] }} className="animate-pulse" />
          <div>
            <p className="text-[13px] font-space font-semibold text-cyber-text">🚨 Attack Simulated</p>
            <p className="text-[11px] text-cyber-muted mt-0.5"><span style={{ color: ATTACK_COLORS[selectedAttack] }}>{selectedAttack}</span> — alerts generated</p>
          </div>
        </motion.div>
      ), { duration: 4000, position: 'top-right' });
      // Also emit to socket for immediate UI update
      const socket = getSocket();
      socket.emit('client_simulate', { attack: selectedAttack });
    } catch (e) {
      toast.error('Simulation failed', { style: { background: '#15141f', color: '#e4e8f0' } });
    }
    setLaunching(false);
  };

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-xl text-cyber-muted hover:text-cyber-text">
          <Menu size={18} />
        </button>
        <h2 className="text-[15px] font-outfit font-semibold text-cyber-text">
          {pageNames[location.pathname] || 'Dashboard'}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Attack Selector */}
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-space text-cyber-muted transition-all hover:text-cyber-text"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Simulate Attack <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl z-50 overflow-hidden"
                style={{ background: '#1a1929', border: '1px solid rgba(255,255,255,0.08)' }}>
                {ATTACKS.map(a => (
                  <button key={a} onClick={() => { setSelectedAttack(a); setShowDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[12px] font-space transition-colors hover:bg-white/5 ${selectedAttack===a?'text-cyber-cyan':'text-cyber-muted'}`}>
                    {a}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Launch Button */}
        <motion.button onClick={handleLaunch} disabled={launching} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-space font-semibold text-white"
          style={{ background: launching ? '#333' : 'linear-gradient(135deg,#7c4dff,#e040fb)', boxShadow: '0 0 20px rgba(124,77,255,0.4)' }}>
          <Zap size={13} className={launching ? 'animate-spin' : 'animate-pulse'} />
          {launching ? 'Launching...' : 'Launch Simulation'}
        </motion.button>
        {/* Threat Badge */}
        <div className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold"
          style={{ background: 'rgba(255,145,0,0.1)', border: '1px solid rgba(255,145,0,0.3)', color: '#ff9100' }}>
          ELEVATED
        </div>
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input className="pl-9 pr-4 py-2 rounded-xl text-[12px] font-space text-cyber-muted outline-none w-48"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            placeholder="Search threats, IPs..." />
        </div>
        {/* Bell */}
        <button className="relative p-2 rounded-xl text-cyber-muted hover:text-cyber-text transition-colors">
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: '#ff1744', color: 'white' }}>{alertCount}</span>
        </button>
        {/* LIVE indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
          <div className="live-dot" />
          <span className="text-[11px] font-mono text-cyber-green">LIVE</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
