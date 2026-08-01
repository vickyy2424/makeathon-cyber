import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, CheckCircle, Clock, BarChart2, Shield } from 'lucide-react';
import { fetchReports } from '../utils/api';
import { usePolling } from '../hooks/useData';
import toast from 'react-hot-toast';

const ICONS = [Shield, BarChart2, FileText, FileText, BarChart2, FileText, CheckCircle, Shield];
const COLORS = ['#ff1744','#ff9100','#7c4dff','#00e5ff','#e040fb','#00e676','#ff9100','#7c4dff'];

const Reports = () => {
  const { data } = usePolling(fetchReports, 30000);
  const reports = data?.reports || [];
  const [generating, setGenerating] = useState(null);

  const handleDownload = async (r) => {
    setGenerating(r.id);
    await new Promise(res => setTimeout(res, 1800));
    toast.success(`${r.title} ready`, { style:{background:'#15141f',color:'#e4e8f0',border:'1px solid rgba(0,230,118,0.2)'} });
    setGenerating(null);
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Reports & Compliance</h1><p className="text-[12px] text-cyber-muted mt-1">Security intelligence reports generated from live data</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:'Reports Generated',v:reports.length,c:'#00e5ff'},{l:'This Week',v:4,c:'#7c4dff'},{l:'Pending Review',v:2,c:'#ff9100'},{l:'Compliance Score',v:'97%',c:'#00e676'}].map((s,i)=>(
          <div key={i} className="glass-card p-4 text-center"><p className="text-2xl font-outfit font-bold" style={{color:s.c}}>{s.v}</p><p className="text-[10px] text-cyber-muted mt-1">{s.l}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((r,i)=>{
          const Icon = ICONS[i%ICONS.length];
          const color = COLORS[i%COLORS.length];
          const isGen = generating===r.id;
          return (
            <motion.div key={r.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} whileHover={{y:-4}}
              className="glass-card p-5 flex flex-col" style={{borderTop:`2px solid ${color}`}}>
              <div className="flex items-center gap-2 mb-3"><Icon size={18} style={{color}}/><span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{background:`${color}15`,color}}>{r.type}</span></div>
              <h3 className="text-[13px] font-space font-semibold text-cyber-text mb-1 flex-1">{r.title}</h3>
              <p className="text-[10px] text-cyber-muted mb-4">{r.size} · {r.date}</p>
              <motion.button whileTap={{scale:0.97}} onClick={()=>handleDownload(r)} disabled={isGen}
                className="w-full py-2 rounded-xl text-[11px] font-space font-semibold flex items-center justify-center gap-2 transition-all"
                style={{background:`${color}15`,border:`1px solid ${color}30`,color}}>
                {isGen ? <><Clock size={12} className="animate-spin"/>Generating...</> : <><Download size={12}/>Download {r.type}</>}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default Reports;
