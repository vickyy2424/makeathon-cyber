import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveTable = ({ events, columns, maxRows = 15 }) => {
  const severityColor = (sev) => {
    const map = { Critical: '#ff1744', High: '#ff9100', Medium: '#7c4dff', Low: '#00e676', Info: '#4a4a6a' };
    return map[sev] || '#7d8ba0';
  };

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {events.slice(0, maxRows).map((event) => (
              <motion.tr
                key={event.id}
                initial={{ opacity: 0, x: -10, backgroundColor: 'rgba(0,229,255,0.05)' }}
                animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {columns.map(col => (
                  <td key={col.key}>
                    {col.key === 'severity' ? (
                      <span style={{ color: severityColor(event[col.key]) }} className="font-semibold">
                        ● {event[col.key]}
                      </span>
                    ) : col.key === 'time' || col.key === 'timestamp' ? (
                      <span className="text-cyber-muted">
                        {new Date(event[col.key]).toLocaleTimeString()}
                      </span>
                    ) : col.key === 'bytes' ? (
                      <span>{(event[col.key] / 1024).toFixed(1)}KB</span>
                    ) : col.render ? (
                      col.render(event[col.key], event)
                    ) : (
                      event[col.key]
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};

export default LiveTable;
