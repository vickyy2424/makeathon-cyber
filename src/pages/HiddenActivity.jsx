import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EyeOff, Globe, Wifi, AlertTriangle, Radio, ShieldAlert } from 'lucide-react';
import { usePolling } from '../hooks/useData';

const HIDDEN = [
  {id:1,type:'TOR Exit Node',src:'198.51.100.45',dst:'192.168.1.22',risk:'High',icon:'🧅',color:'#ff9100',time:'2m ago',detail:'Traffic routed via TOR exit node in Netherlands'},
  {id:2,type:'VPN Detected',src:'104.238.179.121',dst:'192.168.2.100',risk:'Medium',icon:'🔐',color:'#7c4dff',time:'7m ago',detail:'Commercial VPN provider (NordVPN) fingerprinted'},
  {id:3,type:'Proxy Routing',src:'185.220.101.34',dst:'192.168.1.55',risk:'Medium',icon:'🌐',color:'#e040fb',time:'12m ago',detail:'SOCKS5 proxy chain detected, 3 hops'},
  {id:4,type:'MAC Spoofing',src:'192.168.1.78',dst:'192.168.1.1',risk:'High',icon:'🎭',color:'#ff1744',time:'18m ago',detail:'MAC address changed mid-session (Lenovo→Unknown)'},
  {id:5,type:'Rogue Device',src:'192.168.4.201',dst:'—',risk:'Critical',icon:'👻',color:'#ff1744',time:'25m ago',detail:'Unregistered device appeared on VLAN 4'},
  {id:6,type:'DNS over HTTPS',src:'192.168.1.34',dst:'1.1.1.1',risk:'Low',icon:'🔒',color:'#00e5ff',time:'31m ago',detail:'Bypassing corporate DNS resolver'},
  {id:7,type:'Encrypted Tunnel',src:'10.0.0.45',dst:'52.96.166.130',risk:'High',icon:'🕳️',color:'#ff9100',time:'45m ago',detail:'Non-standard port 4444 with encrypted payload'},
  {id:8,type:'Anomalous Beacon',src:'192.168.2.88',dst:'203.0.113.42',risk:'Critical',icon:'📡',color:'#ff1744',time:'52m ago',detail:'Periodic C2 beacon every 30s to external IP'},
];

const RISK_COLOR = {Critical:'#ff1744',High:'#ff9100',Medium:'#7c4dff',Low:'#00e5ff'};

const HiddenActivity = () => {
  const [filter, setFilter] = useState('All');
  const filtered = filter==='All' ? HIDDEN : HIDDEN.filter(h=>h.risk===filter);

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Hidden Activity</h1><p className="text-[12px] text-cyber-muted mt-1">TOR, VPN, proxy, MAC spoofing & rogue device detection</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:'TOR/VPN/Proxy',v:3,c:'#ff9100',i:Globe},{l:'MAC Spoofing',v:1,c:'#ff1744',i:AlertTriangle},{l:'Rogue Devices',v:1,c:'#ff1744',i:Wifi},{l:'Tunnels',v:2,c:'#e040fb',i:Radio}].map((s,i)=>(
          <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${s.c}15`}}><s.i size={18} style={{color:s.c}}/></div>
            <div><p className="text-xl font-outfit font-bold" style={{color:s.c}}>{s.v}</p><p className="text-[10px] text-cyber-muted">{s.l}</p></div>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {['All','Critical','High','Medium','Low'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`filter-tag ${filter===f?'active':''}`}>{f}</button>)}
        <span className="ml-auto text-[11px] font-mono text-cyber-muted">{filtered.length} detections</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((h,i)=>(
          <motion.div key={h.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}} whileHover={{y:-2}}
            className="glass-card p-5" style={{borderLeft:`3px solid ${RISK_COLOR[h.risk]}`}}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{h.icon}</span>
                <div><h4 className="text-[13px] font-space font-semibold text-cyber-text">{h.type}</h4><span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{background:`${RISK_COLOR[h.risk]}15`,color:RISK_COLOR[h.risk]}}>{h.risk}</span></div>
              </div>
              <span className="text-[10px] text-cyber-muted">{h.time}</span>
            </div>
            <p className="text-[11px] text-cyber-muted mb-3">{h.detail}</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-cyber-muted">Source: </span><span className="font-mono text-cyber-orange">{h.src}</span></div>
              <div><span className="text-cyber-muted">Target: </span><span className="font-mono text-cyber-cyan">{h.dst}</span></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default HiddenActivity;
