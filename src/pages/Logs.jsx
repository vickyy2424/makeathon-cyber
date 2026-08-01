import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { fetchLogs } from '../utils/api';
import { usePolling } from '../hooks/useData';

const SEV_C = {Critical:'#ff1744',High:'#ff9100',Medium:'#7c4dff',Low:'#00e676',Info:'#4a4a6a'};

const Logs = () => {
  const { data } = usePolling(fetchLogs, 4000);
  const logs = data?.logs || [];
  const [search, setSearch] = useState('');
  const [sevF, setSevF] = useState('All');
  const [typeF, setTypeF] = useState('All');
  const types = ['All','AUTH','NETWORK','SYSTEM','THREAT','HONEYPOT','SCAN','DEFENSE'];
  const filtered = useMemo(()=>logs.filter(l=>{
    const m1=!search||l.message?.toLowerCase().includes(search.toLowerCase())||l.source?.includes(search);
    const m2=sevF==='All'||l.severity===sevF;
    const m3=typeF==='All'||l.type===typeF;
    return m1&&m2&&m3;
  }),[logs,search,sevF,typeF]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-outfit font-bold text-cyber-text">System Logs</h1><p className="text-[12px] text-cyber-muted mt-1">{logs.length} events captured</p></div>
        <div className="flex items-center gap-2"><div className="live-dot"/><span className="text-[11px] font-mono text-cyber-green">LIVE</span></div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} className="search-input w-full pl-9" placeholder="Search logs..."/></div>
        {['All','Critical','High','Medium','Low'].map(s=><button key={s} onClick={()=>setSevF(s)} className={`filter-tag text-[10px] ${sevF===s?'active':''}`}>{s}</button>)}
      </div>
      <div className="flex items-center gap-1 flex-wrap">{types.map(t=><button key={t} onClick={()=>setTypeF(t)} className={`filter-tag text-[10px] ${typeF===t?'active':''}`}>{t}</button>)}<span className="ml-auto text-[11px] text-cyber-muted font-mono">{filtered.length} entries</span></div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass-card p-5 overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Time</th><th>Type</th><th>Severity</th><th>Source</th><th>Message</th></tr></thead>
          <tbody>
            {filtered.slice(0,100).map((l,i)=>(
              <motion.tr key={l.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:Math.min(i*0.01,0.3)}}>
                <td className="text-cyber-muted whitespace-nowrap text-[11px]">{l.timestamp?new Date(l.timestamp).toLocaleString():''}</td>
                <td><span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04]">{l.type}</span></td>
                <td><span style={{color:SEV_C[l.severity]}} className="font-semibold text-[11px]">● {l.severity}</span></td>
                <td className="text-cyber-orange font-mono text-[11px]">{l.source}</td>
                <td className="text-[11px] text-cyber-text max-w-[400px] truncate">{l.message}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {logs.length===0&&<p className="text-cyber-muted text-sm text-center py-8">Logs populate as events occur...</p>}
      </motion.div>
    </div>
  );
};
export default Logs;
