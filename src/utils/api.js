import axios from 'axios';
import { io } from 'socket.io-client';

const BASE = 'http://localhost:8000';
const api = axios.create({ baseURL: BASE + '/api', timeout: 15000 });

let socket = null;
export function getSocket() {
  if (!socket) {
    socket = io(BASE, { transports: ['websocket','polling'], reconnection: true, reconnectionDelay: 1000 });
    socket.on('connect', () => console.log('[WS] Connected'));
    socket.on('connect_error', (e) => console.warn('[WS]', e.message));
  }
  return socket;
}

export const fetchDashboard    = () => api.get('/dashboard').then(r => r.data);
export const fetchTimeSeries   = () => api.get('/dashboard/timeseries').then(r => r.data);
export const fetchDevices      = () => api.get('/devices').then(r => r.data);
export const startScan         = (ip) => api.post('/scan', { ip_range: ip }).then(r => r.data);
export const fetchTraffic      = () => api.get('/traffic').then(r => r.data);
export const fetchTrafficStats = () => api.get('/traffic/stats').then(r => r.data);
export const fetchProtocols    = () => api.get('/traffic/protocols').then(r => r.data);
export const fetchAlerts       = () => api.get('/alerts').then(r => r.data);
export const fetchThreats      = () => api.get('/threats').then(r => r.data);
export const fetchHoneypot     = () => api.get('/honeypot').then(r => r.data);
export const deployTrap        = (id) => api.post(`/honeypot/deploy/${id}`).then(r => r.data);
export const deactivateTrap    = (id) => api.post(`/honeypot/deactivate/${id}`).then(r => r.data);
export const fetchDetections   = () => api.get('/honeypot/detections').then(r => r.data);
export const fetchLogs         = () => api.get('/logs').then(r => r.data);
export const fetchReports      = () => api.get('/reports').then(r => r.data);
export const fetchSettings     = () => api.get('/settings').then(r => r.data);
export const saveSettings      = (d) => api.post('/settings', d).then(r => r.data);
export const blockIP           = (ip, reason) => api.post('/defense/block', { ip, reason }).then(r => r.data);
export const releaseIP         = (ip) => api.post('/defense/release', { ip }).then(r => r.data);
export const fetchBlocked      = () => api.get('/defense/blocked').then(r => r.data);
export const simulateAttack    = (attack) => api.post('/simulate', { attack }).then(r => r.data);

export default api;
