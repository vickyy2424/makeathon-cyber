// ─── Mock Data Generator for PROBE CyberShield 360 ───

const PROTOCOLS = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'RDP', 'SMB', 'ICMP', 'FTP'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info'];
const ATTACK_TYPES = [
  { name: 'Port Scan', mitre: 'T1046', category: 'Reconnaissance' },
  { name: 'Brute Force SSH', mitre: 'T1110.001', category: 'Credential Access' },
  { name: 'DNS Tunneling', mitre: 'T1071.004', category: 'Command & Control' },
  { name: 'C2 Beacon', mitre: 'T1071.001', category: 'Command & Control' },
  { name: 'Data Exfiltration', mitre: 'T1041', category: 'Exfiltration' },
  { name: 'DDoS Flood', mitre: 'T1498', category: 'Impact' },
  { name: 'Lateral Movement', mitre: 'T1021', category: 'Lateral Movement' },
  { name: 'Credential Dump', mitre: 'T1003', category: 'Credential Access' },
  { name: 'Privilege Escalation', mitre: 'T1068', category: 'Privilege Escalation' },
  { name: 'Ransomware Payload', mitre: 'T1486', category: 'Impact' },
  { name: 'ARP Spoofing', mitre: 'T1557', category: 'Credential Access' },
  { name: 'SQL Injection', mitre: 'T1190', category: 'Initial Access' },
];
const OS_LIST = ['Windows 11 Pro', 'Windows 10 Enterprise', 'Windows Server 2022', 'Windows Server 2019', 'Windows 10 Pro'];
const VENDORS = ['Dell', 'HP', 'Lenovo', 'Microsoft', 'ASUS', 'Cisco', 'VMware'];
const HOSTNAMES = ['WS-', 'SRV-', 'DC-', 'WEB-', 'DB-', 'APP-', 'FW-', 'MAIL-'];
const COUNTRIES = ['United States', 'Russia', 'China', 'Germany', 'Brazil', 'India', 'Japan', 'UK', 'Iran', 'North Korea'];
const CITIES = ['New York', 'Moscow', 'Beijing', 'Berlin', 'São Paulo', 'Mumbai', 'Tokyo', 'London', 'Tehran', 'Pyongyang'];

function randomIP() {
  return `${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*254)+1}`;
}
function internalIP() {
  return `192.168.${Math.floor(Math.random()*5)+1}.${Math.floor(Math.random()*254)+1}`;
}
function randomMAC() {
  return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => '0123456789ABCDEF'[Math.floor(Math.random()*16)]);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export function generateTrafficEvent() {
  const isInternal = Math.random() > 0.3;
  return {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    srcIP: isInternal ? internalIP() : randomIP(),
    dstIP: isInternal ? internalIP() : randomIP(),
    protocol: pick(PROTOCOLS),
    port: pick([22, 80, 443, 3389, 445, 53, 8080, 21, 25, 3306, 5432, 8443]),
    bytes: rand(64, 65535),
    severity: pick(SEVERITIES),
    packets: rand(1, 200),
  };
}

export function generateAlert() {
  const attack = pick(ATTACK_TYPES);
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    attackName: attack.name,
    mitreId: attack.mitre,
    category: attack.category,
    confidence: rand(60, 99),
    severity: pick(['Critical', 'High', 'Medium']),
    srcIP: Math.random() > 0.5 ? randomIP() : internalIP(),
    dstIP: internalIP(),
    srcCountry: pick(COUNTRIES),
    port: pick([22, 80, 443, 3389, 445, 53]),
    status: pick(['Active', 'Investigating', 'Contained']),
    description: `Detected ${attack.name} activity targeting internal infrastructure via ${attack.category} techniques.`,
  };
}

export function generateDevice(index) {
  const hostname = pick(HOSTNAMES) + String(rand(100, 999));
  const risk = rand(0, 100);
  return {
    id: crypto.randomUUID(),
    ip: internalIP(),
    mac: randomMAC(),
    hostname,
    os: pick(OS_LIST),
    vendor: pick(VENDORS),
    riskScore: risk,
    status: risk > 70 ? 'Critical' : risk > 40 ? 'Warning' : 'Healthy',
    firewallOn: Math.random() > 0.2,
    antivirusActive: Math.random() > 0.15,
    openPorts: Array.from({length: rand(1, 6)}, () => pick([22, 80, 135, 139, 443, 445, 3389, 5985, 8080])),
    lastSeen: new Date(Date.now() - rand(0, 3600000)).toISOString(),
    vulnerabilities: rand(0, 15),
    patchesMissing: rand(0, 8),
  };
}

export function generateKPIs() {
  return {
    totalDevices: rand(1200, 1500),
    activeSessions: rand(3400, 5200),
    totalAlerts: rand(45, 120),
    packetsPerSec: rand(12000, 45000),
    blockedThreats: rand(180, 350),
    riskScore: rand(40, 85),
    bandwidth: (rand(500, 2000) / 100).toFixed(1),
    uptime: '99.97%',
  };
}

export function generateTimeSeriesData(points = 24) {
  const data = [];
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    data.push({
      time: new Date(now - i * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      events: rand(100, 800),
      alerts: rand(5, 50),
      blocked: rand(10, 60),
      traffic: rand(500, 3000),
    });
  }
  return data;
}

export function generateProtocolDistribution() {
  return [
    { name: 'HTTPS', value: rand(30, 45), color: '#00e5ff' },
    { name: 'HTTP', value: rand(15, 25), color: '#7c4dff' },
    { name: 'DNS', value: rand(10, 20), color: '#e040fb' },
    { name: 'SSH', value: rand(5, 15), color: '#00e676' },
    { name: 'SMB', value: rand(3, 10), color: '#ff9100' },
    { name: 'RDP', value: rand(2, 8), color: '#ff1744' },
    { name: 'Other', value: rand(5, 15), color: '#4a4a6a' },
  ];
}

export function generateTopSources(count = 5) {
  return Array.from({ length: count }, () => ({
    ip: randomIP(),
    country: pick(COUNTRIES),
    city: pick(CITIES),
    requests: rand(500, 15000),
    severity: pick(SEVERITIES),
  }));
}

export function generateTopDestinations(count = 5) {
  return Array.from({ length: count }, () => ({
    ip: internalIP(),
    hostname: pick(HOSTNAMES) + rand(100, 999),
    port: pick([80, 443, 22, 3389, 445]),
    connections: rand(200, 8000),
  }));
}

export function generateKillChainData() {
  return [
    { stage: 'Reconnaissance', mitre: 'TA0043', count: rand(5, 20), active: Math.random() > 0.3, color: '#7c4dff' },
    { stage: 'Initial Access', mitre: 'TA0001', count: rand(2, 12), active: Math.random() > 0.4, color: '#00e5ff' },
    { stage: 'Credential Access', mitre: 'TA0006', count: rand(3, 15), active: Math.random() > 0.4, color: '#e040fb' },
    { stage: 'Lateral Movement', mitre: 'TA0008', count: rand(1, 8), active: Math.random() > 0.5, color: '#ff9100' },
    { stage: 'Command & Control', mitre: 'TA0011', count: rand(2, 10), active: Math.random() > 0.5, color: '#ff1744' },
    { stage: 'Exfiltration', mitre: 'TA0010', count: rand(0, 5), active: Math.random() > 0.6, color: '#ff1744' },
    { stage: 'Impact', mitre: 'TA0040', count: rand(0, 3), active: Math.random() > 0.7, color: '#ff1744' },
  ];
}

export function generateHoneypotTraps() {
  return [
    { id: 1, name: 'SSH Trap', port: 22, type: 'service', icon: '🔒', deployed: true, hits: rand(5, 50), lastHit: new Date(Date.now() - rand(0, 86400000)).toISOString() },
    { id: 2, name: 'RTSP Trap', port: 554, type: 'camera', icon: '📹', deployed: true, hits: rand(2, 20), lastHit: new Date(Date.now() - rand(0, 86400000)).toISOString() },
    { id: 3, name: 'ONVIF Trap', port: 8899, type: 'camera', icon: '📷', deployed: false, hits: 0, lastHit: null },
    { id: 4, name: 'MJPEG Trap', port: 8080, type: 'camera', icon: '🎥', deployed: true, hits: rand(1, 15), lastHit: new Date(Date.now() - rand(0, 86400000)).toISOString() },
    { id: 5, name: 'API Trap', port: 8443, type: 'web', icon: '🌐', deployed: true, hits: rand(10, 80), lastHit: new Date(Date.now() - rand(0, 86400000)).toISOString() },
    { id: 6, name: 'DB Trap', port: 3306, type: 'database', icon: '🗄️', deployed: false, hits: 0, lastHit: null },
    { id: 7, name: 'Camera Admin', port: 80, type: 'admin', icon: '🖥️', deployed: true, hits: rand(3, 30), lastHit: new Date(Date.now() - rand(0, 86400000)).toISOString() },
    { id: 8, name: 'Canary Creds', port: null, type: 'credential', icon: '🔑', deployed: true, hits: rand(1, 10), lastHit: new Date(Date.now() - rand(0, 86400000)).toISOString() },
  ];
}

export function generateLogs(count = 50) {
  const types = ['AUTH', 'NETWORK', 'SYSTEM', 'THREAT', 'HONEYPOT', 'SCAN', 'DEFENSE'];
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    timestamp: new Date(Date.now() - i * rand(10000, 120000)).toISOString(),
    type: pick(types),
    severity: pick(SEVERITIES),
    source: Math.random() > 0.5 ? internalIP() : randomIP(),
    message: pick([
      'Failed login attempt from external source',
      'Port scan detected on subnet 192.168.1.0/24',
      'Firewall rule triggered — blocked inbound connection',
      'Honeypot trap SSH interaction logged',
      'Vulnerability scan completed for 192.168.1.0/24',
      'Device quarantined: suspicious C2 beacon activity',
      'DNS query to known malicious domain blocked',
      'Brute force attempt on RDP service detected',
      'ARP spoofing detected on VLAN 10',
      'Canary credential accessed from 10.0.0.45',
      'TOR exit node traffic detected from external IP',
      'Patch management scan found 12 missing updates',
      'SSL certificate expiring in 7 days on SRV-201',
    ]),
  }));
}

export function generateHiddenActivity() {
  return {
    torConnections: rand(2, 15),
    vpnProxyDetected: rand(5, 25),
    macSpoofing: rand(0, 8),
    rogueDevices: rand(0, 5),
    anonymousTraffic: rand(100, 5000),
    suspiciousDNS: rand(10, 100),
  };
}

export { ATTACK_TYPES, COUNTRIES, SEVERITIES };
