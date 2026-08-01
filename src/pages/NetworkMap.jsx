import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

const NetworkMap = () => {
  const canvasRef = useRef(null);
  const [nodes] = useState(() => {
    const list = [];
    // Core nodes
    list.push({ id: 'fw', x: 400, y: 60, label: 'Firewall', type: 'firewall', color: '#ff9100' });
    list.push({ id: 'sw1', x: 250, y: 160, label: 'Switch-A', type: 'switch', color: '#7c4dff' });
    list.push({ id: 'sw2', x: 550, y: 160, label: 'Switch-B', type: 'switch', color: '#7c4dff' });
    list.push({ id: 'dc', x: 400, y: 260, label: 'DC-01', type: 'server', color: '#00e5ff' });
    // Endpoints
    for (let i = 0; i < 8; i++) {
      list.push({ id: `ws${i}`, x: 80 + i * 90, y: 360 + (i % 2) * 50, label: `WS-${100 + i}`, type: 'workstation', color: i < 6 ? '#00e676' : '#ff1744' });
    }
    for (let i = 0; i < 4; i++) {
      list.push({ id: `srv${i}`, x: 180 + i * 160, y: 480, label: ['WEB-01', 'DB-01', 'APP-01', 'MAIL-01'][i], type: 'server', color: '#00e5ff' });
    }
    return list;
  });

  const edges = [
    ['fw', 'sw1'], ['fw', 'sw2'], ['sw1', 'dc'], ['sw2', 'dc'],
    ['sw1', 'ws0'], ['sw1', 'ws1'], ['sw1', 'ws2'], ['sw1', 'ws3'],
    ['sw2', 'ws4'], ['sw2', 'ws5'], ['sw2', 'ws6'], ['sw2', 'ws7'],
    ['dc', 'srv0'], ['dc', 'srv1'], ['dc', 'srv2'], ['dc', 'srv3'],
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    function draw() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw edges
      edges.forEach(([from, to]) => {
        const a = nodeMap[from], b = nodeMap[to];
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(124,77,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Packet animation
        const t = ((frame * 2 + edges.indexOf(arguments[0]) * 30) % 200) / 200;
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach(n => {
        // Glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = n.color + '15';
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#15141f';
        ctx.strokeStyle = n.color + '80';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Icon dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        // Label
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#7d8ba0';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + 26);
      });

      requestAnimationFrame(draw);
    }
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [nodes]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-outfit font-bold text-cyber-text">Network Map</h1>
          <p className="text-[12px] text-cyber-muted mt-1">Real-time network topology visualization</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-cyber btn-cyan text-[11px] py-1.5 px-3"><ZoomIn size={12} /></button>
          <button className="btn-cyber btn-cyan text-[11px] py-1.5 px-3"><ZoomOut size={12} /></button>
          <button className="btn-cyber btn-cyan text-[11px] py-1.5 px-3"><RefreshCw size={12} /> Refresh</button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-2" style={{ minHeight: 560 }}>
        <canvas ref={canvasRef} width={800} height={550} className="w-full" style={{ maxHeight: 550 }} />
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-2">
        {[
          { color: '#ff9100', label: 'Firewall' },
          { color: '#7c4dff', label: 'Switch' },
          { color: '#00e5ff', label: 'Server' },
          { color: '#00e676', label: 'Healthy' },
          { color: '#ff1744', label: 'Compromised' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            <span className="text-[11px] text-cyber-muted">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkMap;
