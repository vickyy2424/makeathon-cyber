import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldOff, Ban, Unlock, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchBlocked, blockIP, releaseIP, fetchDevices } from '../utils/api';
import { usePolling } from '../hooks/useData';
import toast from 'react-hot-toast';

const ActiveDefense = () => {
  const { data: bd } = usePolling(fetchBlocked, 5000);
  const { data: dd } = usePolling(fetchDevices, 10000);
  const blocked = bd?.blocked || [];
  const devices = dd?.devices || [];
  const [manualIP, setManualIP] = useState('');
  const [log, setLog] = useState([
    {time:'2m ago',action:'Auto-blocked',target:'87.251.64.110',reason:'Port scan detected',type:'block'},
    {time:'8m ago',action:'Quarantined',target:'192.168.2.45',reason:'C2 beacon activity',type:'quarantine'},
    {time:'15m ago',action:'Firewall rule',target:'203.0.113.0/24',reason:'Geo-block: CN',type:'block'},
    {time:'22m ago',action:'Released',target:'192.168.1.88',reason:'False positive cleared',type:'release'},
  ]);

  const doBlock = async (ip, reason='Manual block') => {
    if(!ip)return;
    try { await blockIP(ip,reason); toast.success(`Blocked ${ip}`); setLog(p=>[{time:'just now',action:'Blocked',target:ip,reason,type:'block'},...p]); setManualIP(''); }
    catch(e){ toast.error('Failed'); }
  };
  const doRelease = async (ip) => {
    try { await releaseIP(ip); toast.success(`Released ${ip}`); setLog(p=>[{time:'just now',action:'Released',target:ip,reason:'Admin action',type:'release'},...p]); }
    catch(e){ toast.error('Failed'); }
  };

  const quickActions = [
    {label:'Block Highest Risk',icon:Ban,color:'#ff1744',desc:'Auto-block top risk device',fn:()=>{ const d=devices.sort((a,b)=>b.riskScore-a.riskScore)[0]; if(d)doBlock(d.ip,'Auto-block: highest risk'); }},
    {label:'Quarantine Critical',icon:ShieldOff,color:'#ff9100',desc:'Isolate all critical hosts',fn:()=>{ devices.filter(d=>d.status==='Critical').slice(0,3).forEach(d=>doBlock(d.ip,'Quarantine: critical risk')); }},
    {label:'Release Safe Hosts',icon:Unlock,color:'#00e676',desc:'Unblock low-risk devices',fn:()=>{ blocked.slice(0,2).forEach(b=>doRelease(b.ip)); }},
    {label:'Activate Countermeasures',icon:Shield,color:'#7c4dff',desc:'Deploy active defenses',fn:()=>{ toast.success('Countermeasures activated'); setLog(p=>[{time:'just now',action:'Countermeasures',target:'All hosts',reason:'Manual activation',type:'block'},...p]); }},
  ];

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Active Defense</h1><p className="text-[12px] text-cyber-muted mt-1">Real-time threat response & IP management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((a,i)=>(
          <motion.button key={i} onClick={a.fn} whileHover={{y:-4,boxShadow:`0 8px 30px ${a.color}20`}} whileTap={{scale:0.97}}
            className="glass-card p-5 text-left transition-all" style={{borderTop:`2px solid ${a.color}`}}>
            <a.icon size={20} style={{color:a.color}} className="mb-3"/>
            <p className="text-[13px] font-space font-semibold text-cyber-text">{a.label}</p>
            <p className="text-[10px] text-cyber-muted mt-1">{a.desc}</p>
          </motion.button>
        ))}
      </div>
      <div className="glass-card p-5">
        <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-3">Block IP</h3>
        <div className="flex gap-3">
          <input value={manualIP} onChange={e=>setManualIP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doBlock(manualIP,'Manual block')}
            className="search-input flex-1 pl-4" placeholder="Enter IP to block (e.g. 192.168.1.45)"/>
          <motion.button whileTap={{scale:0.97}} onClick={()=>doBlock(manualIP,'Manual block')}
            className="px-5 py-2 rounded-xl text-[12px] font-space font-semibold text-white flex items-center gap-2"
            style={{background:'linear-gradient(135deg,#ff1744,#ff5722)'}}>
            <Ban size={13}/> Block
          </motion.button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass-card p-5">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-4">Blocked IPs ({blocked.length})</h3>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            <AnimatePresence>
              {blocked.map((b,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}
                  className="flex items-center justify-between p-3 rounded-xl" style={{border:'1px solid rgba(255,23,68,0.12)',background:'rgba(255,23,68,0.04)'}}>
                  <div className="flex items-center gap-3"><ShieldOff size={14} className="text-cyber-red"/>
                    <div><p className="text-[12px] font-mono text-cyber-text">{b.ip}</p><p className="text-[10px] text-cyber-muted">{b.reason}</p></div>
                  </div>
                  <button onClick={()=>doRelease(b.ip)} className="text-[10px] px-3 py-1 rounded-lg font-semibold text-cyber-green hover:bg-green-500/10 transition-colors border border-green-500/20">Release</button>
                </motion.div>
              ))}
            </AnimatePresence>
            {blocked.length===0&&<p className="text-cyber-muted text-[11px] text-center py-6">No blocked IPs. Use actions above to block threats.</p>}
          </div>
        </motion.div>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass-card p-5">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-4">Defense Log</h3>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {log.map((l,i)=>(
              <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                {l.type==='block'?<Ban size={13} className="text-cyber-red mt-0.5"/>:l.type==='release'?<CheckCircle size={13} className="text-cyber-green mt-0.5"/>:<ShieldOff size={13} className="text-cyber-orange mt-0.5"/>}
                <div className="flex-1">
                  <p className="text-[12px] text-cyber-text"><span className="font-semibold">{l.action}</span> — {l.target}</p>
                  <p className="text-[10px] text-cyber-muted">{l.reason} · {l.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default ActiveDefense;
