"""
Real Threat Detection Engine.
Analyzes live traffic patterns to detect: port scans, brute force,
beaconing, DNS anomalies, exfiltration spikes, DoS floods.
"""
import threading, time
from datetime import datetime, timedelta
from collections import defaultdict, deque

MITRE_MAP = {
    "Port Scan": {"id": "T1046", "cat": "Reconnaissance", "sev": "Medium"},
    "Brute Force": {"id": "T1110", "cat": "Credential Access", "sev": "High"},
    "C2 Beaconing": {"id": "T1071.001", "cat": "Command & Control", "sev": "Critical"},
    "DNS Anomaly": {"id": "T1071.004", "cat": "Command & Control", "sev": "High"},
    "Data Exfiltration": {"id": "T1041", "cat": "Exfiltration", "sev": "Critical"},
    "DoS Flood": {"id": "T1498", "cat": "Impact", "sev": "Critical"},
    "Lateral Movement": {"id": "T1021", "cat": "Lateral Movement", "sev": "High"},
    "Suspicious Port": {"id": "T1571", "cat": "Command & Control", "sev": "Medium"},
}

class ThreatEngine:
    def __init__(self):
        self.alerts = deque(maxlen=200)
        self._conn_tracker = defaultdict(list)  # src_ip -> [(dst_ip, port, time)]
        self._byte_tracker = defaultdict(int)     # src_ip -> bytes in window
        self._dns_tracker = defaultdict(int)       # src_ip -> dns query count
        self._port_tracker = defaultdict(set)      # src_ip -> set of dst ports
        self._beacon_tracker = defaultdict(list)   # src_ip -> [timestamps]
        self._lock = threading.Lock()
        self.killchain = {
            "Reconnaissance": {"mitre": "TA0043", "count": 0, "active": False, "color": "#7c4dff"},
            "Initial Access": {"mitre": "TA0001", "count": 0, "active": False, "color": "#00e5ff"},
            "Credential Access": {"mitre": "TA0006", "count": 0, "active": False, "color": "#e040fb"},
            "Lateral Movement": {"mitre": "TA0008", "count": 0, "active": False, "color": "#ff9100"},
            "Command & Control": {"mitre": "TA0011", "count": 0, "active": False, "color": "#ff1744"},
            "Exfiltration": {"mitre": "TA0010", "count": 0, "active": False, "color": "#ff1744"},
            "Impact": {"mitre": "TA0040", "count": 0, "active": False, "color": "#ff1744"},
        }

    def analyze_packet(self, pkt: dict):
        """Feed a packet dict and check for threats."""
        src = pkt.get("srcIP", "")
        dst = pkt.get("dstIP", "")
        port = pkt.get("port", 0)
        proto = pkt.get("protocol", "")
        size = pkt.get("bytes", 0)
        now = datetime.utcnow()

        with self._lock:
            self._conn_tracker[src].append((dst, port, now))
            self._byte_tracker[src] += size
            self._port_tracker[src].add(port)
            self._beacon_tracker[src].append(now)
            if proto == "DNS":
                self._dns_tracker[src] += 1

            # Trim old entries (60s window)
            cutoff = now - timedelta(seconds=60)
            self._conn_tracker[src] = [(d, p, t) for d, p, t in self._conn_tracker[src] if t > cutoff]
            self._beacon_tracker[src] = [t for t in self._beacon_tracker[src] if t > cutoff]

            # Port Scan: >15 unique ports from same source in 60s
            if len(self._port_tracker[src]) > 15:
                self._create_alert("Port Scan", src, dst, port, 75,
                    f"Source {src} probed {len(self._port_tracker[src])} ports in 60s")
                self._port_tracker[src].clear()

            # Brute Force: >10 connections to same port in 60s
            port_conns = [c for c in self._conn_tracker[src] if c[1] in (22, 3389, 445)]
            if len(port_conns) > 10:
                self._create_alert("Brute Force", src, dst, port, 85,
                    f"Brute force: {len(port_conns)} auth attempts from {src}")

            # DNS Anomaly: >50 DNS queries in 60s
            if self._dns_tracker[src] > 50:
                self._create_alert("DNS Anomaly", src, dst, 53, 70,
                    f"Abnormal DNS volume: {self._dns_tracker[src]} queries from {src}")
                self._dns_tracker[src] = 0

            # Exfiltration: >5MB from single source in 60s
            if self._byte_tracker[src] > 5_000_000:
                self._create_alert("Data Exfiltration", src, dst, port, 90,
                    f"High data transfer: {self._byte_tracker[src]//1024}KB from {src}")
                self._byte_tracker[src] = 0

            # DoS Flood: >200 packets from single source in 60s
            if len(self._conn_tracker[src]) > 200:
                self._create_alert("DoS Flood", src, dst, port, 95,
                    f"Flood detected: {len(self._conn_tracker[src])} packets from {src}")

            # Beaconing: regular interval connections (check for 5+ at ~same interval)
            timestamps = self._beacon_tracker[src]
            if len(timestamps) >= 5:
                intervals = [(timestamps[i] - timestamps[i-1]).total_seconds() for i in range(1, len(timestamps))]
                if intervals and max(intervals) - min(intervals) < 2 and min(intervals) > 0:
                    self._create_alert("C2 Beaconing", src, dst, port, 88,
                        f"Regular beacon pattern from {src} (interval ~{intervals[0]:.1f}s)")
                    self._beacon_tracker[src].clear()

            # Suspicious ports
            suspicious_ports = {4444, 5555, 6666, 7777, 8888, 9999, 1337, 31337}
            if port in suspicious_ports:
                self._create_alert("Suspicious Port", src, dst, port, 65,
                    f"Connection to suspicious port {port} from {src}")

    def _create_alert(self, attack_name, src, dst, port, confidence, desc):
        info = MITRE_MAP.get(attack_name, {"id": "T0000", "cat": "Unknown", "sev": "Medium"})
        alert = {
            "id": len(self.alerts) + 1,
            "timestamp": datetime.utcnow().isoformat(),
            "attackName": attack_name,
            "mitreId": info["id"],
            "category": info["cat"],
            "severity": info["sev"],
            "confidence": confidence,
            "srcIP": src, "dstIP": dst, "port": port,
            "status": "Active",
            "description": desc,
        }
        self.alerts.appendleft(alert)
        # Update kill chain
        cat = info["cat"]
        if cat in self.killchain:
            self.killchain[cat]["count"] += 1
            self.killchain[cat]["active"] = True

    def get_alerts(self, limit=50):
        return list(self.alerts)[:limit]

    def get_killchain(self):
        return [
            {"stage": k, "mitre": v["mitre"], "count": v["count"], "active": v["active"], "color": v["color"]}
            for k, v in self.killchain.items()
        ]

threat_engine = ThreatEngine()
