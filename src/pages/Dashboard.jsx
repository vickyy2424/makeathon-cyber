import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Activity, ShieldAlert, Zap, ShieldOff, Gauge, Globe } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/MetricCard';
import LiveTable from '../components/LiveTable';
import { fetchDashboard, fetchTimeSeries, fetchProtocols, fetchTrafficStats } from '../utils/api';
import { usePolling, useSocketEvent, useSocketList } from '../hooks/useData';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="glass-card px-3 py-2 text-[11px]" style={{ background:'#15141f', border:'1px solid rgba(255,255,255,0.08)' }}>
    <p className="text-cyber-muted mb-1">{label}</p>
    {payload.map((p,i) => <p key={i} style={{ color:p.color }} className="font-mono">{p.name}: {p.value?.toLocaleString()}</p>)}
  </div>;
};

const WorldMap = () => {
  const canvasRef = useRef(null); const atks = useRef([]);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); const W = c.width, H = c.height;
    const dots = Array.from({length:200}, () => ({x:Math.random()*W, y:20+Math.random()*(H-40)}));
    function addAtk() { if (atks.current.length<8) atks.current.push({sx:Math.random()*W,sy:Math.random()*H,tx:Math.random()*W,ty:Math.random()*H,p:0,o:1,col:['#ff1744','#ff9100','#e040fb','#00e5ff'][Math.floor(Math.random()*4)]}); }
    let aid; function draw() {
      ctx.clearRect(0,0,W,H); ctx.fillStyle='rgba(0,229,255,0.08)';
      dots.forEach(d=>{ctx.beginPath();ctx.arc(d.x,d.y,1,0,Math.PI*2);ctx.fill();});
      atks.current.forEach((a,i)=>{
        a.p+=0.009; if(a.p>1.5)a.o-=0.025; if(a.o<=0){atks.current.splice(i,1);return;}
        const pp=Math.min(a.p,1),cx=a.sx+(a.tx-a.sx)*pp,cy=a.sy+(a.ty-a.sy)*pp-Math.sin(pp*Math.PI)*40;
        ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.quadraticCurveTo((a.sx+a.tx)/2,Math.min(a.sy,a.ty)-40,cx,cy);
        ctx.strokeStyle=`${a.col}${Math.floor(a.o*153).toString(16).padStart(2,'0')}`;ctx.lineWidth=1.5;ctx.stroke();
        ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fillStyle=`${a.col}${Math.floor(a.o*255).toString(16).padStart(2,'0')}`;ctx.fill();
      }); aid=requestAnimationFrame(draw);
    }
    draw(); const iv=setInterval(addAtk,2000);
    return()=>{cancelAnimationFrame(aid);clearInterval(iv);};
  },[]);
  return <div className="relative h-full min-h-[240px]">
    <canvas ref={canvasRef} width={600} height={280} className="w-full h-full"/>
    <div className="absolute top-3 left-3 flex items-center gap-2"><Globe size={14} className="text-cyber-cyan"/><span className="text-[11px] font-space text-cyber-muted">LIVE THREAT MAP</span></div>
  </div>;
};

const Dashboard = () => {
  const wsKpis = useSocketEvent('kpi_update');
  const { data: restKpis } = usePolling(fetchDashboard, 5000);
  const kpis = wsKpis || restKpis || { totalDevices:34, activeSessions:478, totalAlerts:12, packetsPerSec:245, blockedThreats:3, riskScore:42 };

  const wsTs = useSocketEvent('timeseries_update');
  const { data: restTs } = usePolling(fetchTimeSeries, 10000);
  const [timeSeries, setTimeSeries] = useState([]);
  useEffect(() => { const data = wsTs || restTs; if (data?.length) setTimeSeries(data); }, [wsTs, restTs]);

  const wsProto = useSocketEvent('protocol_update');
  const { data: restProto } = usePolling(fetchProtocols, 10000);
  const protocol = wsProto || restProto || [];

  const { data: stats } = usePolling(fetchTrafficStats, 6000);
  const topSrc = (stats?.top_sources || []).slice(0,5).map(([ip,c])=>({ip,requests:c}));
  const topDst = (stats?.top_destinations || []).slice(0,5).map(([ip,c])=>({ip,connections:c}));

  const liveEvents = useSocketList('live_traffic', 30);
  const evtCols = [{key:'time',label:'Time'},{key:'srcIP',label:'Source'},{key:'dstIP',label:'Dest'},{key:'protocol',label:'Proto'},{key:'port',label:'Port'},{key:'bytes',label:'Bytes'}];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Devices" value={kpis.totalDevices} icon={Monitor} color="#00e5ff" trend={3}/>
        <MetricCard title="Sessions" value={kpis.activeSessions} icon={Activity} color="#7c4dff" trend={12} isLive/>
        <MetricCard title="Alerts" value={kpis.totalAlerts} icon={ShieldAlert} color="#ff1744" trend={-5}/>
        <MetricCard title="Packets/s" value={kpis.packetsPerSec} icon={Zap} color="#e040fb" isLive/>
        <MetricCard title="Blocked" value={kpis.blockedThreats} icon={ShieldOff} color="#ff9100" trend={8}/>
        <MetricCard title="Risk Score" value={kpis.riskScore} icon={Gauge} color={kpis.riskScore>60?'#ff1744':'#00e676'} suffix="/100"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-outfit font-semibold text-cyber-text">Events Over Time</h3>
            <div className="flex items-center gap-2"><div className="live-dot"/><span className="text-[10px] text-cyber-muted font-mono">LIVE</span></div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e5ff" stopOpacity={0.3}/><stop offset="100%" stopColor="#00e5ff" stopOpacity={0}/></linearGradient>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff1744" stopOpacity={0.3}/><stop offset="100%" stopColor="#ff1744" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'#4a4a6a',fontSize:10}}/>
              <YAxis axisLine={false} tickLine={false} tick={{fill:'#4a4a6a',fontSize:10}}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="events" stroke="#00e5ff" fill="url(#ge)" strokeWidth={2} name="Packets/s" dot={false}/>
              <Area type="monotone" dataKey="alerts" stroke="#ff1744" fill="url(#ga)" strokeWidth={2} name="Alerts" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}} className="glass-card p-5"><WorldMap/></motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass-card p-5">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-4">Protocol Mix</h3>
          {protocol.length>0 ? <>
            <ResponsiveContainer width="100%" height={160}><PieChart><Pie data={protocol} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">{protocol.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}</Pie><Tooltip content={<Tip/>}/></PieChart></ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">{protocol.slice(0,4).map(p=><span key={p.name} className="text-[10px] font-mono flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:p.color}}/>{p.name}</span>)}</div>
          </> : <p className="text-cyber-muted text-[11px] text-center py-8">Loading...</p>}
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-card p-5">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-4">Traffic Volume</h3>
          <ResponsiveContainer width="100%" height={160}><BarChart data={timeSeries.slice(-8)}><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'#4a4a6a',fontSize:9}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#4a4a6a',fontSize:9}}/><Tooltip content={<Tip/>}/><Bar dataKey="traffic" fill="#7c4dff" radius={[4,4,0,0]} name="KB"/></BarChart></ResponsiveContainer>
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="glass-card p-5">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-3">Top Sources</h3>
          <div className="space-y-2.5">
            {topSrc.length>0 ? topSrc.map((s,i)=><div key={i} className="flex items-center justify-between"><p className="text-[11px] font-mono text-cyber-text">{s.ip}</p><span className="text-[11px] font-mono text-cyber-orange">{s.requests?.toLocaleString()}</span></div>)
            : [['192.168.1.45',1247],['192.168.2.103',986],['10.0.0.22',754],['172.16.0.5',632],['192.168.3.78',421]].map(([ip,v],i)=><div key={i} className="flex items-center justify-between"><p className="text-[11px] font-mono text-cyber-text">{ip}</p><span className="text-[11px] font-mono text-cyber-orange">{v}</span></div>)}
          </div>
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.25}} className="glass-card p-5">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text mb-3">Top Destinations</h3>
          <div className="space-y-2.5">
            {topDst.length>0 ? topDst.map((d,i)=><div key={i} className="flex items-center justify-between"><p className="text-[11px] font-mono text-cyber-cyan">{d.ip}</p><span className="text-[11px] font-mono text-cyber-purple">{d.connections?.toLocaleString()}</span></div>)
            : [['8.8.8.8',3421],['1.1.1.1',2187],['52.96.166.130',1654],['104.18.32.7',1203],['13.107.42.14',876]].map(([ip,v],i)=><div key={i} className="flex items-center justify-between"><p className="text-[11px] font-mono text-cyber-cyan">{ip}</p><span className="text-[11px] font-mono text-cyber-purple">{v}</span></div>)}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-outfit font-semibold text-cyber-text">Live Events Feed</h3>
          <div className="flex items-center gap-2"><div className="live-dot"/><span className="text-[10px] text-cyber-muted font-mono">STREAMING</span></div>
        </div>
        <LiveTable events={liveEvents} columns={evtCols}/>
      </motion.div>
    </div>
  );
};
export default Dashboard;
