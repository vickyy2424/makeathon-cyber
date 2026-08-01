import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import NetworkMap from './pages/NetworkMap';
import TrafficFeed from './pages/TrafficFeed';
import ThreatDetection from './pages/ThreatDetection';
import HiddenActivity from './pages/HiddenActivity';
import DeviceAttribution from './pages/DeviceAttribution';
import KillChain from './pages/KillChain';
import ActiveDefense from './pages/ActiveDefense';
import Honeypot from './pages/Honeypot';
import Cases from './pages/Cases';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#15141f', color: '#e4e8f0', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'Space Grotesk', fontSize: '13px' },
      }} />
      <div className="min-h-screen flex" style={{ background: '#09080d' }}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div 
          className="flex-1 flex flex-col transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? 68 : 220 }}
        >
          <Topbar toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className="flex-1 p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px)' }}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/devices" element={<PageWrapper><Devices /></PageWrapper>} />
                <Route path="/network-map" element={<PageWrapper><NetworkMap /></PageWrapper>} />
                <Route path="/traffic" element={<PageWrapper><TrafficFeed /></PageWrapper>} />
                <Route path="/threats" element={<PageWrapper><ThreatDetection /></PageWrapper>} />
                <Route path="/hidden" element={<PageWrapper><HiddenActivity /></PageWrapper>} />
                <Route path="/attribution" element={<PageWrapper><DeviceAttribution /></PageWrapper>} />
                <Route path="/killchain" element={<PageWrapper><KillChain /></PageWrapper>} />
                <Route path="/defense" element={<PageWrapper><ActiveDefense /></PageWrapper>} />
                <Route path="/honeypot" element={<PageWrapper><Honeypot /></PageWrapper>} />
                <Route path="/cases" element={<PageWrapper><Cases /></PageWrapper>} />
                <Route path="/reports" element={<PageWrapper><Reports /></PageWrapper>} />
                <Route path="/logs" element={<PageWrapper><Logs /></PageWrapper>} />
                <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
