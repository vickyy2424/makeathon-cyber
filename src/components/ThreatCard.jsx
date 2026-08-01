import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Search, ShieldOff } from 'lucide-react';

const ThreatCard = ({ alert, onInvestigate, onQuarantine }) => {
  const severityConfig = {
    Critical: { border: '#ff1744', bg: 'rgba(255,23,68,0.06)', badge: 'threat-critical' },
    High: { border: '#ff9100', bg: 'rgba(255,145,0,0.04)', badge: 'threat-high' },
    Medium: { border: '#7c4dff', bg: 'rgba(124,77,255,0.04)', badge: 'threat-medium' },
    Low: { border: '#00e676', bg: 'rgba(0,230,118,0.04)', badge: 'threat-low' },
  };

  const config = severityConfig[alert.severity] || severityConfig.Medium;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card p-5"
      style={{ borderLeft: `3px solid ${config.border}`, background: config.bg }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-cyber-text font-space">{alert.attackName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono text-cyber-cyan">{alert.mitreId}</span>
            <span className="text-[10px] text-cyber-muted">•</span>
            <span className="text-[11px] text-cyber-muted">{alert.category}</span>
          </div>
        </div>
        <span className={`threat-badge ${config.badge}`}>{alert.severity}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3 text-[11px]">
        <div>
          <span className="text-cyber-muted block">Confidence</span>
          <span className="font-mono text-cyber-text font-semibold">{alert.confidence}%</span>
          <div className="progress-bar mt-1">
            <div className="progress-bar-fill" style={{ width: `${alert.confidence}%`, background: `linear-gradient(90deg, ${config.border}, transparent)` }} />
          </div>
        </div>
        <div>
          <span className="text-cyber-muted block">Source</span>
          <span className="font-mono text-cyber-orange text-[11px]">{alert.srcIP}</span>
        </div>
        <div>
          <span className="text-cyber-muted block">Target</span>
          <span className="font-mono text-cyber-cyan text-[11px]">{alert.dstIP}</span>
        </div>
      </div>

      <p className="text-[11px] text-cyber-muted mb-3 leading-relaxed">{alert.description}</p>

      <div className="flex items-center gap-2">
        <button onClick={() => onInvestigate?.(alert)} className="btn-cyber btn-cyan text-[11px] py-1.5 px-3">
          <Search size={12} /> Investigate
        </button>
        <button className="btn-cyber text-[11px] py-1.5 px-3" style={{ background: 'rgba(124,77,255,0.1)', color: '#7c4dff', border: '1px solid rgba(124,77,255,0.2)' }}>
          <Crosshair size={12} /> Evidence
        </button>
        <button onClick={() => onQuarantine?.(alert)} className="btn-cyber btn-danger text-[11px] py-1.5 px-3">
          <ShieldOff size={12} /> Quarantine
        </button>
      </div>
    </motion.div>
  );
};

export default ThreatCard;
