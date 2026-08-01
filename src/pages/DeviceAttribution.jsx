import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fetchDevices } from '../utils/api';
import { usePolling } from '../hooks/useData';
import { Monitor, Wifi, Printer, Server, Camera, HardDrive, Router } from 'lucide-react';

const TYPE_ICON = { Router, Printer, Camera, NAS: HardDrive, Server, default: Monitor };
const getIcon = (os) => {
  if(os?.includes('Router')||os?.includes('RouterOS')) return Router;
  if(os?.includes('Print')) return Printer;
  if(os?.includes('Camera')) return Camera;
  if(os?.includes('Synology')||os?.includes('DSM')) return HardDrive;
  if(os?.includes('Server')) return Server;
  return Monitor;
};

const DeviceAttribution = () => {
  const { data } = usePolling(fetchDevices, 10000);
  const devices = data?.devices || [];
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('risk');
  const filtered = devices.filter(d => !search || d.ip?.includes(search) || d.hostname?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sort==='risk' ? b.riskScore-a.riskScore : sort==='hostname' ? a.hostname?.localeCompare(b.hostname) : 0);

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Device Attribution</h1><p className="text-[12px] text-cyber-muted mt-1">{devices.length} network assets · Risk-ranked attribution</p></div>
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e=>setSearch(e.target.value)} className="search-input flex-1 min-w-[200px] pl-4" placeholder="Search by IP or hostname..."/>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="search-input w-40 pl-4 bg-transparent cursor-pointer">
          <option value="risk">Sort: Risk Score</option>
          <option value="hostname">Sort: Hostname</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d,i)=>{
          const Icon = getIcon(d.os);
          const color = d.riskScore>70?'#ff1744':d.riskScore>40?'#ff9100':'#00e676';
          return (
            <motion.div key={d.id||i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*0.025,0.5)}} whileHover={{y:-3}}
              className="glass-card p-5" style={{borderLeft:`3px solid ${color}`}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`${color}15`}}><Icon size={16} style={{color}}/></div><span className="text-[13px] font-space font-semibold text-cyber-text">{d.hostname}</span></div>
                <span className="text-[11px] font-mono font-bold" style={{color}}>{d.riskScore}</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-cyber-muted">IP</span><span className="font-mono text-cyber-cyan">{d.ip}</span></div>
                <div className="flex justify-between"><span className="text-cyber-muted">MAC</span><span className="font-mono text-cyber-text text-[10px]">{d.mac}</span></div>
                <div className="flex justify-between"><span className="text-cyber-muted">OS</span><span className="text-cyber-text">{d.os}</span></div>
                <div className="flex justify-between"><span className="text-cyber-muted">Vendor</span><span className="text-cyber-text">{d.vendor}</span></div>
                <div className="flex justify-between"><span className="text-cyber-muted">Open Ports</span><span className="font-mono text-cyber-orange text-[10px]">{(d.openPorts||[]).join(', ')||'None'}</span></div>
                <div className="flex justify-between"><span className="text-cyber-muted">Status</span><span style={{color}}>{d.status}</span></div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full transition-all" style={{width:`${d.riskScore}%`,background:`linear-gradient(90deg,${color},${color}88)`}}/></div>
            </motion.div>
          );
        })}
        {devices.length===0&&<p className="text-cyber-muted text-sm col-span-3 text-center py-10">No devices discovered. Run a scan from the Devices page.</p>}
      </div>
    </div>
  );
};
export default DeviceAttribution;
