import React from 'react';
import { motion } from 'framer-motion';
import { Bug, Crosshair, UserX, Globe } from 'lucide-react';
import { fetchHoneypot, deployTrap, deactivateTrap } from '../utils/api';
import { usePolling, useSocketList } from '../hooks/useData';
import toast from 'react-hot-toast';

const Honeypot = () => {
  const { data } = usePolling(fetchHoneypot, 4000);
  const traps = data?.traps || [];
  const restDets = data?.detections || [];
  const liveDets = useSocketList('trap_detection', 50);
  const dets = [...liveDets, ...restDets].filter((d,i,a)=>a.findIndex(b=>b.time===d.time&&b.attacker===d.attacker)===i).slice(0,25);

  const handleDeploy = async (id) => { try { await deployTrap(id); toast.success('Trap deployed'); } catch(e){} };
  const handleDeact  = async (id) => { try { await deactivateTrap(id); toast.success('Trap deactivated'); } catch(e){} };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-outfit font-bold text-cyber-text">AI Honeypot Engine</h1><p className="text-[12px] text-cyber-muted mt-1">Deploy deception traps · Capture attacker intelligence</p></div>
        <div className="flex items-center gap-2"><Bug size={16} className="text-cyber-magenta animate-pulse"/><span className="text-[11px] font-mono text-cyber-magenta">{traps.filter(t=>t.deployed).length} ACTIVE TRAPS</span></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {traps.map((t,i)=>(
          <motion.div key={t.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:i*0.05}} whileHover={{y:-4}}
            className="glass-card p-4 cursor-pointer" style={{borderTop:`2px solid ${t.deployed?'#00e676':'#2a2a3a'}`}}>
            <div className="text-xl mb-2">{t.icon}</div>
            <h4 className="text-[12px] font-space font-semibold text-cyber-text">{t.name}</h4>
            <p className="text-[10px] font-mono text-cyber-muted">Port {t.port||'N/A'}</p>
            <div className="flex items-center justify-between my-2">
              <span className={`text-[10px] font-mono ${t.deployed?'text-cyber-green':'text-cyber-muted'}`}>{t.deployed?'● ACTIVE':'○ IDLE'}</span>
              <span className="text-[10px] font-mono text-cyber-orange">{t.hits} hits</span>
            </div>
            <button onClick={()=>t.deployed?handleDeact(t.id):handleDeploy(t.id)}
              className={`w-full text-[10px] py-1.5 rounded-lg font-semibold border transition-all ${t.deployed?'bg-red-500/10 text-cyber-red border-red-500/20 hover:bg-red-500/20':'bg-green-500/10 text-cyber-green border-green-500/20 hover:bg-green-500/20'}`}>
              {t.deployed?'Deactivate':'Deploy'}
            </button>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4"><Crosshair size={16} className="text-cyber-magenta"/><h3 className="text-sm font-outfit font-semibold text-cyber-text">Live Detections</h3><div className="ml-auto live-dot"/></div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {dets.map((d,i)=>(
              <motion.div key={i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                className="p-3 rounded-xl" style={{border:'1px solid rgba(224,64,251,0.12)',background:'rgba(224,64,251,0.04)'}}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-mono font-bold text-cyber-orange">{d.attacker}</span>
                  <span className="text-[10px] text-cyber-muted">{d.time?new Date(d.time).toLocaleTimeString():''}</span>
                </div>
                <p className="text-[11px] text-cyber-text">{d.action} → <span className="text-cyber-magenta">{d.trap}</span></p>
                {d.country&&<p className="text-[10px] text-cyber-muted mt-0.5"><Globe size={9} className="inline mr-1"/>{d.country}</p>}
                {d.creds&&<p className="text-[10px] font-mono text-cyber-red mt-1">🔑 {d.creds}</p>}
              </motion.div>
            ))}
            {dets.length===0&&<p className="text-cyber-muted text-[11px] text-center py-6">No detections yet. Deploy traps above.</p>}
          </div>
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4"><UserX size={16} className="text-cyber-red"/><h3 className="text-sm font-outfit font-semibold text-cyber-text">Trap Analytics</h3></div>
          <div className="space-y-3">
            {[{l:'Total Hits',v:traps.reduce((a,t)=>a+t.hits,0),c:'#00e5ff'},{l:'Active Traps',v:traps.filter(t=>t.deployed).length,c:'#00e676'},{l:'Unique Attackers',v:new Set(dets.map(d=>d.attacker)).size,c:'#e040fb'},{l:'Creds Captured',v:dets.filter(d=>d.creds).length,c:'#ff9100'},{l:'Total Sessions',v:dets.length,c:'#7c4dff'}].map((s,i)=>(
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-[12px] text-cyber-muted">{s.l}</span>
                <span className="text-lg font-outfit font-bold" style={{color:s.c}}>{s.v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default Honeypot;
