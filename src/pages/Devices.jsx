import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Search, ScanSearch, ShieldCheck, ShieldAlert, Wifi } from 'lucide-react';
import { fetchDevices, startScan } from '../utils/api';
import { usePolling } from '../hooks/useData';
import toast from 'react-hot-toast';

const Devices = () => {
  const { data } = usePolling(fetchDevices, 10000);
  const devices = data?.devices || [];
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleScan = async () => {
    setScanning(true); setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(p+3, 95)), 200);
    try { const r = await startScan(null); toast.success(`Scan complete: ${r.devices_found} devices found`, {style:{background:'#15141f',color:'#e4e8f0',border:'1px solid rgba(0,230,118,0.2)'}}); setProgress(100); }
    catch(e) { toast.error('Scan failed'); }
    clearInterval(iv); setTimeout(()=>{setScanning(false);setProgress(0);},500);
  };

  const filtered = devices.filter(d => {
    const ms = !search || d.ip?.includes(search) || d.hostname?.toLowerCase().includes(search.toLowerCase());
    const ms2 = statusFilter==='All' || d.status===statusFilter;
    return ms&&ms2;
  });

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Device Management</h1><p className="text-[12px] text-cyber-muted mt-1">Network device discovery & vulnerability assessment</p></div>
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleScan} disabled={scanning} className="btn-cyber btn-primary flex items-center gap-2">
            <ScanSearch size={14} className={scanning?'animate-spin':''}/>{scanning?'Scanning...':'Scan Network'}
          </button>
          <div className="flex-1 min-w-[200px]">
            {scanning&&<div><div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-cyber-cyan transition-all duration-300" style={{width:`${progress}%`}}/></div><p className="text-[10px] text-cyber-muted mt-1">Scanning via ARP + Ping + TCP ({progress}%)</p></div>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:'Total',v:devices.length,c:'#00e5ff'},{l:'Healthy',v:devices.filter(d=>d.status==='Healthy').length,c:'#00e676'},{l:'Warning',v:devices.filter(d=>d.status==='Warning').length,c:'#ff9100'},{l:'Critical',v:devices.filter(d=>d.status==='Critical').length,c:'#ff1744'}].map((s,i)=><div key={i} className="glass-card p-4 text-center"><p className="text-2xl font-outfit font-bold" style={{color:s.c}}>{s.v}</p><p className="text-[10px] text-cyber-muted">{s.l}</p></div>)}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} className="search-input w-full pl-8" placeholder="Search devices..."/></div>
        {['All','Healthy','Warning','Critical'].map(f=><button key={f} onClick={()=>setStatusFilter(f)} className={`filter-tag ${statusFilter===f?'active':''}`}>{f}</button>)}
      </div>
      <div className="glass-card p-5 overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Device</th><th>IP Address</th><th>MAC</th><th>OS</th><th>Vendor</th><th>Open Ports</th><th>Risk</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((d,i)=>(
              <motion.tr key={d.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.015}}>
                <td><div className="flex items-center gap-2"><Monitor size={13} className="text-cyber-cyan"/><span className="text-[12px]">{d.hostname}</span></div></td>
                <td className="font-mono text-cyber-cyan text-[11px]">{d.ip}</td>
                <td className="font-mono text-cyber-muted text-[10px]">{d.mac}</td>
                <td className="text-[11px]">{d.os}</td>
                <td className="text-[11px] text-cyber-muted">{d.vendor}</td>
                <td className="font-mono text-[10px] text-cyber-orange">{(d.openPorts||[]).join(', ')}</td>
                <td><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full" style={{width:`${d.riskScore}%`,background:d.riskScore>70?'#ff1744':d.riskScore>40?'#ff9100':'#00e676'}}/></div><span className="text-[11px] font-mono font-bold" style={{color:d.riskScore>70?'#ff1744':d.riskScore>40?'#ff9100':'#00e676'}}>{d.riskScore}</span></div></td>
                <td><span className="text-[11px]" style={{color:d.status==='Critical'?'#ff1744':d.status==='Warning'?'#ff9100':'#00e676'}}>● {d.status}</span></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {devices.length===0&&<p className="text-cyber-muted text-sm text-center py-8">No devices yet. Click Scan Network to discover devices.</p>}
      </div>
    </div>
  );
};
export default Devices;
