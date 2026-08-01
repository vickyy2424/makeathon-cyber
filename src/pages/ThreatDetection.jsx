import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Search, ShieldOff, FileSearch } from 'lucide-react';
import { fetchAlerts } from '../utils/api';
import { usePolling, useSocketList } from '../hooks/useData';

const SEV = { Critical:'#ff1744', High:'#ff9100', Medium:'#7c4dff', Low:'#00e676', Info:'#4a4a6a' };

const ThreatDetection = () => {
  const { data } = usePolling(fetchAlerts, 5000);
  const live = useSocketList('live_alert', 80);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const all = [...live, ...(data?.alerts||[])];
  const unique = all.filter((a,i,arr)=>arr.findIndex(b=>b.timestamp===a.timestamp&&b.attackName===a.attackName)===i);
  const filtered = unique.filter(a=>{
    const ms = filter==='All'||a.severity===filter;
    const ms2 = !search||a.attackName?.toLowerCase().includes(search.toLowerCase())||a.srcIP?.includes(search);
    return ms&&ms2;
  });
  const stats = [{l:'Total',v:unique.length,c:'#00e5ff'},{l:'Critical',v:unique.filter(a=>a.severity==='Critical').length,c:'#ff1744'},{l:'Active',v:unique.filter(a=>a.status==='Active').length,c:'#ff9100'},{l:'Contained',v:unique.filter(a=>a.status==='Contained').length,c:'#00e676'}];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Threat Detection</h1><p className="text-[12px] text-cyber-muted mt-1">MITRE ATT&CK mapped real-time threat intelligence</p></div>
        <div className="flex items-center gap-2"><div className="live-dot"/><span className="text-[11px] font-mono text-cyber-green">ENGINE ACTIVE</span></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s,i)=><motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="glass-card px-4 py-3 flex items-center justify-between"><span className="text-[11px] text-cyber-muted">{s.l}</span><span className="text-xl font-outfit font-bold" style={{color:s.c}}>{s.v}</span></motion.div>)}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} className="search-input pl-9" placeholder="Search alerts..."/></div>
        {['All','Critical','High','Medium','Low'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`filter-tag ${filter===f?'active':''}`}>{f}</button>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {filtered.slice(0,20).map((a,i)=>(
            <motion.div key={a.id||i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{delay:i*0.02}}
              className="glass-card p-5" style={{borderLeft:`3px solid ${SEV[a.severity]||'#4a4a6a'}`}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{background:`${SEV[a.severity]}15`,color:SEV[a.severity]}}>{a.severity}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-cyber-muted">{a.mitreId}</span>
                </div>
                <span className="text-[10px] text-cyber-muted">{a.timestamp?new Date(a.timestamp).toLocaleTimeString():''}</span>
              </div>
              <h4 className="text-[13px] font-space font-semibold text-cyber-text mb-2">{a.attackName}</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                <div><span className="text-cyber-muted">SRC: </span><span className="font-mono text-cyber-orange">{a.srcIP}</span></div>
                <div><span className="text-cyber-muted">DST: </span><span className="font-mono text-cyber-cyan">{a.dstIP}</span></div>
                <div><span className="text-cyber-muted">Category: </span><span className="text-cyber-text">{a.category}</span></div>
                <div><span className="text-cyber-muted">Status: </span><span style={{color:a.status==='Active'?'#ff1744':a.status==='Contained'?'#00e676':'#ff9100'}}>{a.status}</span></div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-cyber-muted">Confidence</span><span className="text-[10px] font-mono text-cyber-cyan">{a.confidence}%</span></div>
                <div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full" style={{width:`${a.confidence}%`,background:`linear-gradient(90deg,${SEV[a.severity]},${SEV[a.severity]}99)`}}/></div>
              </div>
              <div className="flex gap-2">
                <button className="btn-cyber flex-1 text-[10px] py-1.5" style={{borderColor:'rgba(0,229,255,0.2)',color:'#00e5ff'}}><Crosshair size={11}/> Investigate</button>
                <button className="btn-cyber flex-1 text-[10px] py-1.5" style={{borderColor:'rgba(255,23,68,0.2)',color:'#ff1744'}}><ShieldOff size={11}/> Quarantine</button>
                <button className="btn-cyber text-[10px] py-1.5 px-2" style={{borderColor:'rgba(255,255,255,0.1)',color:'#4a4a6a'}}><FileSearch size={11}/></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length===0&&<p className="text-cyber-muted text-sm col-span-2 text-center py-10">No threats match filters. Launch a simulation to see alerts.</p>}
      </div>
    </div>
  );
};
export default ThreatDetection;
