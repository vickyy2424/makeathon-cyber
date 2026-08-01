import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Clock, Network, Gauge, Shield, Mail, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { fetchSettings, saveSettings } from '../utils/api';

const Settings = () => {
  const [s, setS] = useState({scanInterval:300,subnetRange:'192.168.1.0/24',threatSensitivity:70,autoQuarantine:true,emailAlerts:false,emailAddress:''});
  useEffect(()=>{fetchSettings().then(d=>setS(p=>({...p,...d}))).catch(()=>{});}, []);
  const u = (k,v) => setS(p=>({...p,[k]:v}));
  const save = async () => {
    try { await saveSettings(s); toast.success('Settings saved',{style:{background:'#15141f',color:'#e4e8f0',border:'1px solid rgba(0,230,118,0.2)'}}); }
    catch(e){ toast.error('Failed'); }
  };
  const Toggle = ({on,fn}) => <button onClick={()=>fn(!on)} className={`w-11 h-6 rounded-full relative transition-all ${on?'bg-cyber-cyan/30':'bg-white/10'}`}><span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${on?'left-6 bg-cyber-cyan':'left-1 bg-cyber-muted'}`}/></button>;
  const Row = ({icon:I,color,label,desc,children}) => (
    <div className="flex items-center justify-between py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
      <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`${color}15`}}><I size={16} style={{color}}/></div><div><p className="text-[13px] font-space font-medium text-cyber-text">{label}</p><p className="text-[11px] text-cyber-muted">{desc}</p></div></div>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <Toaster position="top-right"/>
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Platform Settings</h1><p className="text-[12px] text-cyber-muted mt-1">Configure scanning, defense & notification parameters</p></div>
        <motion.button whileTap={{scale:0.97}} onClick={save} className="btn-cyber btn-primary flex items-center gap-2"><Save size={14}/>Save Settings</motion.button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass-card p-6">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-2">Scanning & Detection</h3>
          <Row icon={Clock} color="#00e5ff" label="Scan Interval" desc="Seconds between auto-scans"><input type="number" value={s.scanInterval} onChange={e=>u('scanInterval',+e.target.value)} className="search-input w-24 text-center pl-3"/></Row>
          <Row icon={Network} color="#7c4dff" label="Subnet Range" desc="Target network CIDR"><input type="text" value={s.subnetRange} onChange={e=>u('subnetRange',e.target.value)} className="search-input w-44 pl-3"/></Row>
          <Row icon={Gauge} color="#e040fb" label="Threat Sensitivity" desc={`${s.threatSensitivity}% — ${s.threatSensitivity>80?'Aggressive':s.threatSensitivity>50?'Balanced':'Conservative'}`}><input type="range" min="10" max="100" value={s.threatSensitivity} onChange={e=>u('threatSensitivity',+e.target.value)} className="w-32 accent-cyber-magenta"/></Row>
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-card p-6">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-2">Defense & Notifications</h3>
          <Row icon={Shield} color="#ff1744" label="Auto Quarantine" desc="Isolate critical threats automatically"><Toggle on={s.autoQuarantine} fn={v=>u('autoQuarantine',v)}/></Row>
          <Row icon={Mail} color="#ff9100" label="Email Alerts" desc="Send critical alert notifications"><Toggle on={s.emailAlerts} fn={v=>u('emailAlerts',v)}/></Row>
          <Row icon={Mail} color="#ff9100" label="Alert Email" desc="Notification destination"><input type="email" value={s.emailAddress} onChange={e=>u('emailAddress',e.target.value)} className="search-input w-52 pl-3" placeholder="admin@company.com"/></Row>
        </motion.div>
      </div>
    </div>
  );
};
export default Settings;
