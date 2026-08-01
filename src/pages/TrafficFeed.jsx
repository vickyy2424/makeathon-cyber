import React from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import LiveTable from '../components/LiveTable';
import { useSocketList, usePolling } from '../hooks/useData';
import { fetchTraffic } from '../utils/api';

const TrafficFeed = () => {
  const live = useSocketList('live_traffic', 100);
  const { data } = usePolling(fetchTraffic, 5000);
  const events = live.length > 0 ? live : (data?.events || []);
  const cols = [{key:'time',label:'Timestamp'},{key:'srcIP',label:'Source IP'},{key:'dstIP',label:'Dest IP'},{key:'protocol',label:'Protocol'},{key:'port',label:'Port'},{key:'bytes',label:'Size'}];
  const protoCount = (p) => events.filter(e=>p.includes(e.protocol)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-outfit font-bold text-cyber-text">Live Traffic Feed</h1><p className="text-[12px] text-cyber-muted mt-1">Real-time network packet stream</p></div>
        <div className="flex items-center gap-2"><Radio size={16} className="text-cyber-green animate-pulse"/><span className="text-[11px] font-mono text-cyber-green">CAPTURING</span><span className="text-[11px] font-mono text-cyber-muted ml-2">{events.length} packets</span></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:'TCP',c:'#00e5ff',p:['TCP']},{l:'UDP',c:'#7c4dff',p:['UDP']},{l:'HTTP/S',c:'#e040fb',p:['HTTP','HTTPS']},{l:'DNS',c:'#00e676',p:['DNS']}].map((s,i)=>(
          <div key={i} className="glass-card p-3 flex items-center justify-between"><span className="text-[11px] text-cyber-muted font-space">{s.l}</span><span className="text-xl font-outfit font-bold" style={{color:s.c}}>{protoCount(s.p)}</span></div>
        ))}
      </div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass-card p-5"><LiveTable events={events} columns={cols} maxRows={60}/></motion.div>
    </div>
  );
};
export default TrafficFeed;
