import React from 'react';
import { useCountUp } from '../hooks/useData';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon: Icon, color = '#00e5ff', suffix = '', prefix = '', trend, isLive }) => {
  const displayValue = useCountUp(typeof value === 'number' ? value : parseInt(value) || 0);
  
  const colorMap = {
    '#00e5ff': { bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.15)', glow: '0 0 24px rgba(0,229,255,0.15)' },
    '#7c4dff': { bg: 'rgba(124,77,255,0.08)', border: 'rgba(124,77,255,0.15)', glow: '0 0 24px rgba(124,77,255,0.15)' },
    '#e040fb': { bg: 'rgba(224,64,251,0.08)', border: 'rgba(224,64,251,0.15)', glow: '0 0 24px rgba(224,64,251,0.15)' },
    '#00e676': { bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.15)', glow: '0 0 24px rgba(0,230,118,0.15)' },
    '#ff9100': { bg: 'rgba(255,145,0,0.08)', border: 'rgba(255,145,0,0.15)', glow: '0 0 24px rgba(255,145,0,0.15)' },
    '#ff1744': { bg: 'rgba(255,23,68,0.08)', border: 'rgba(255,23,68,0.15)', glow: '0 0 24px rgba(255,23,68,0.15)' },
  };
  
  const style = colorMap[color] || colorMap['#00e5ff'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: style.glow }}
      transition={{ duration: 0.3 }}
      className="metric-card"
      style={{ '--accent-gradient': `linear-gradient(90deg, ${color}, transparent)`, '--accent-glow': style.glow }}
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: style.bg, border: `1px solid ${style.border}` }}
        >
          {Icon && <Icon size={18} style={{ color }} />}
        </div>
        {isLive && <div className="live-dot" />}
        {trend && (
          <span className={`text-xs font-mono font-semibold ${trend > 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-cyber-muted text-[11px] font-space uppercase tracking-wider mb-1">{title}</p>
      <p className="font-outfit font-bold text-2xl" style={{ color }}>
        {prefix}{typeof value === 'number' ? displayValue.toLocaleString() : value}{suffix}
      </p>
    </motion.div>
  );
};

export default MetricCard;
