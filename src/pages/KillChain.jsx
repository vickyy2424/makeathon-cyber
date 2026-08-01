import React from 'react';
import { motion } from 'framer-motion';
import { fetchThreats } from '../utils/api';
import { usePolling, useSocketEvent } from '../hooks/useData';

const ICONS = ['🔍','🔓','🔑','↔️','📡','📤','💥'];

const KillChain = () => {
  const { data } = usePolling(fetchThreats, 5000);
  const wsKc = useSocketEvent('killchain_update');
  const stages = wsKc || data?.killchain || [];

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Attack Kill Chain</h1><p className="text-[12px] text-cyber-muted mt-1">MITRE ATT&CK kill chain — live stage tracking</p></div>
      <div className="glass-card p-6 overflow-x-auto">
        <div className="flex items-stretch gap-0 min-w-[900px]">
          {stages.map((s, i) => (
            <React.Fragment key={s.stage}>
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}} whileHover={{y:-5,transition:{duration:0.2}}}
                className="flex-1 p-4 rounded-2xl text-center cursor-pointer transition-all relative overflow-hidden"
                style={{background:s.active?`${s.color}12`:'rgba(255,255,255,0.03)',border:`1px solid ${s.active?s.color+'40':'rgba(255,255,255,0.06)'}`,boxShadow:s.active?`0 0 20px ${s.color}20`:'none'}}>
                {s.active&&<div className="absolute inset-0 animate-pulse" style={{background:`${s.color}05`}}/>}
                <div className="text-2xl mb-2">{ICONS[i]||'⚡'}</div>
                <h4 className="text-[12px] font-space font-semibold text-cyber-text mb-1">{s.stage}</h4>
                <p className="text-[10px] font-mono text-cyber-muted mb-2">{s.mitre}</p>
                <p className="text-2xl font-outfit font-bold mb-2" style={{color:s.color}}>{s.count}</p>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${s.active?'bg-red-500/10 text-cyber-red border border-red-500/20':'bg-white/5 text-cyber-muted'}`}>
                  {s.active?'● ACTIVE':'○ CLEAR'}
                </span>
              </motion.div>
              {i<stages.length-1&&<div className="flex items-center px-1"><div style={{width:2,height:'60%',background:`linear-gradient(180deg,transparent,rgba(255,255,255,0.1),transparent)`}}/></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stages.filter(s=>s.active).map((s,i)=>(
          <motion.div key={i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
            className="glass-card p-4" style={{borderLeft:`3px solid ${s.color}`}}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[13px] font-space font-semibold text-cyber-text">{s.stage}</h4>
              <span className="text-[11px] font-mono font-bold" style={{color:s.color}}>{s.count} events</span>
            </div>
            <p className="text-[11px] text-cyber-muted">{s.mitre} · Active campaign detected</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full animate-pulse" style={{width:`${Math.min(s.count*10,100)}%`,background:s.color}}/></div>
          </motion.div>
        ))}
        {stages.filter(s=>s.active).length===0&&<p className="text-cyber-muted text-sm text-center py-6 col-span-2">No active kill chain stages. Launch a simulation to populate.</p>}
      </div>
    </div>
  );
};
export default KillChain;
