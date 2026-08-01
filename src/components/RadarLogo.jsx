import React from 'react';

const RadarLogo = ({ size = 48 }) => {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 100 100" className="flex-shrink-0">
        {/* Outer ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth="1" />
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(0,229,255,0.08)" strokeWidth="0.8" />
        
        {/* Center dot */}
        <circle cx="50" cy="50" r="3" fill="#00e5ff">
          <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Sweep line */}
        <line x1="50" y1="50" x2="50" y2="5" stroke="url(#sweepGrad)" strokeWidth="2" strokeLinecap="round" className="radar-sweep" />
        
        {/* Radar gradient */}
        <defs>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="radarGlow">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Glow area behind sweep */}
        <circle cx="50" cy="50" r="44" fill="url(#radarGlow)" className="radar-sweep" style={{ opacity: 0.5 }} />
        
        {/* Cross hairs */}
        <line x1="50" y1="8" x2="50" y2="15" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" />
        <line x1="50" y1="85" x2="50" y2="92" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" />
        <line x1="8" y1="50" x2="15" y2="50" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" />
        <line x1="85" y1="50" x2="92" y2="50" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" />
        
        {/* Blips */}
        <circle cx="35" cy="30" r="2" fill="#00e676">
          <animate attributeName="opacity" values="0;1;0" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="68" cy="40" r="2" fill="#ff1744">
          <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="55" cy="70" r="2" fill="#ff9100">
          <animate attributeName="opacity" values="0;1;0" dur="3s" begin="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div>
        <h1 className="font-outfit font-bold text-[15px] tracking-wide">
          <span className="text-cyber-cyan">PROBE</span>
          <span className="text-cyber-text"> CYBER</span>
        </h1>
        <p className="text-[10px] text-cyber-muted tracking-[2px] uppercase">Shield 360</p>
      </div>
    </div>
  );
};

export default RadarLogo;
