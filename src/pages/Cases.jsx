import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const cases = [
  { id: 'CASE-001', title: 'Suspected APT Campaign', status: 'Active', severity: 'Critical', assignee: 'Admin', created: '2h ago', alerts: 8, description: 'Multiple indicators of a coordinated attack targeting financial data.' },
  { id: 'CASE-002', title: 'Brute Force on RDP', status: 'Active', severity: 'High', assignee: 'Admin', created: '4h ago', alerts: 5, description: 'Sustained brute force attempts on RDP service from external IP.' },
  { id: 'CASE-003', title: 'Rogue Device Investigation', status: 'Pending', severity: 'Medium', assignee: 'Unassigned', created: '1d ago', alerts: 2, description: 'Unknown device detected on VLAN 10 with suspicious behavior.' },
  { id: 'CASE-004', title: 'Data Exfiltration Attempt', status: 'Resolved', severity: 'Critical', assignee: 'Admin', created: '2d ago', alerts: 12, description: 'Large data transfer to external IP blocked and investigated.' },
  { id: 'CASE-005', title: 'TOR Exit Node Traffic', status: 'Resolved', severity: 'Medium', assignee: 'Admin', created: '3d ago', alerts: 3, description: 'Internal host communicating through TOR network.' },
];

const statusColor = { Active: '#ff1744', Pending: '#ff9100', Resolved: '#00e676' };
const sevColor = { Critical: '#ff1744', High: '#ff9100', Medium: '#7c4dff', Low: '#00e676' };

const Cases = () => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-outfit font-bold text-cyber-text">Investigation Cases</h1>
        <p className="text-[12px] text-cyber-muted mt-1">Track and manage security investigation workflows</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center"><p className="text-2xl font-outfit font-bold text-cyber-red">{cases.filter(c => c.status === 'Active').length}</p><p className="text-[10px] text-cyber-muted">Active</p></div>
        <div className="glass-card p-4 text-center"><p className="text-2xl font-outfit font-bold text-cyber-orange">{cases.filter(c => c.status === 'Pending').length}</p><p className="text-[10px] text-cyber-muted">Pending</p></div>
        <div className="glass-card p-4 text-center"><p className="text-2xl font-outfit font-bold text-cyber-green">{cases.filter(c => c.status === 'Resolved').length}</p><p className="text-[10px] text-cyber-muted">Resolved</p></div>
      </div>

      <div className="space-y-3">
        {cases.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card p-5" style={{ borderLeft: `3px solid ${statusColor[c.status]}` }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase size={14} style={{ color: statusColor[c.status] }} />
                  <span className="text-[11px] font-mono text-cyber-muted">{c.id}</span>
                </div>
                <h3 className="text-sm font-space font-semibold text-cyber-text mt-1">{c.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`threat-badge text-[9px]`} style={{ background: `${sevColor[c.severity]}15`, color: sevColor[c.severity], border: `1px solid ${sevColor[c.severity]}30` }}>{c.severity}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${statusColor[c.status]}15`, color: statusColor[c.status] }}>{c.status}</span>
              </div>
            </div>
            <p className="text-[11px] text-cyber-muted mb-3">{c.description}</p>
            <div className="flex items-center gap-4 text-[10px] text-cyber-muted">
              <span className="flex items-center gap-1"><Clock size={10} /> {c.created}</span>
              <span><AlertTriangle size={10} className="inline" /> {c.alerts} alerts</span>
              <span>Assigned: {c.assignee}</span>
              <button className="ml-auto btn-cyber btn-cyan text-[10px] py-1 px-2">View Details</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Cases;
