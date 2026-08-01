"""
Real-time packet sniffer using scapy or psutil fallback.
Captures live network traffic and computes stats.
"""
import asyncio, time, threading, psutil
from datetime import datetime
from collections import defaultdict, deque

class LiveSniffer:
    def __init__(self):
        self.running = False
        self._packets = deque(maxlen=500)
        self._stats = {
            "packets_per_sec": 0,
            "bytes_per_sec": 0,
            "total_packets": 0,
            "total_bytes": 0,
            "protocols": defaultdict(int),
            "src_ips": defaultdict(int),
            "dst_ips": defaultdict(int),
        }
        self._last_count = 0
        self._last_time = time.time()
        self._scapy_available = False
        self._thread = None
        self._try_import_scapy()

    def _try_import_scapy(self):
        try:
            from scapy.all import sniff, IP, TCP, UDP, DNS
            self._scapy_available = True
            print("[Sniffer] Scapy available — real packet capture enabled")
        except ImportError:
            print("[Sniffer] Scapy not available — using psutil network counters")

    def start(self):
        if self.running:
            return
        self.running = True
        if self._scapy_available:
            self._thread = threading.Thread(target=self._scapy_capture, daemon=True)
        else:
            self._thread = threading.Thread(target=self._psutil_capture, daemon=True)
        self._thread.start()
        # Stats updater
        threading.Thread(target=self._update_rates, daemon=True).start()
        print("[Sniffer] Started")

    def stop(self):
        self.running = False

    def _scapy_capture(self):
        try:
            from scapy.all import sniff as sc_sniff, IP, TCP, UDP
            def handler(pkt):
                if not self.running:
                    return
                if IP in pkt:
                    proto = "TCP" if TCP in pkt else "UDP" if UDP in pkt else "Other"
                    src = pkt[IP].src
                    dst = pkt[IP].dst
                    size = len(pkt)
                    port = 0
                    if TCP in pkt:
                        port = pkt[TCP].dport
                    elif UDP in pkt:
                        port = pkt[UDP].dport
                    event = {
                        "time": datetime.utcnow().isoformat(),
                        "srcIP": src, "dstIP": dst,
                        "protocol": self._guess_protocol(proto, port),
                        "port": port, "bytes": size, "packets": 1,
                        "severity": "Info",
                    }
                    self._packets.appendleft(event)
                    self._stats["total_packets"] += 1
                    self._stats["total_bytes"] += size
                    self._stats["protocols"][event["protocol"]] += 1
                    self._stats["src_ips"][src] += 1
                    self._stats["dst_ips"][dst] += 1

            sc_sniff(prn=handler, store=False, stop_filter=lambda _: not self.running)
        except Exception as e:
            print(f"[Sniffer] Scapy capture error: {e}, falling back to psutil")
            self._scapy_available = False
            self._psutil_capture()

    def _psutil_capture(self):
        """Fallback: use psutil network IO counters for real stats."""
        prev = psutil.net_io_counters()
        while self.running:
            time.sleep(1)
            curr = psutil.net_io_counters()
            pkts = curr.packets_recv - prev.packets_recv + curr.packets_sent - prev.packets_sent
            byts = curr.bytes_recv - prev.bytes_recv + curr.bytes_sent - prev.bytes_sent
            self._stats["total_packets"] += pkts
            self._stats["total_bytes"] += byts
            # Generate a representative event from real counters
            if pkts > 0:
                conns = []
                try:
                    conns = psutil.net_connections(kind='inet')[:20]
                except:
                    pass
                for c in conns[:5]:
                    if c.laddr and c.raddr:
                        proto = "TCP" if c.type == 1 else "UDP"
                        port = c.raddr.port if c.raddr else 0
                        event = {
                            "time": datetime.utcnow().isoformat(),
                            "srcIP": c.laddr.ip, "dstIP": c.raddr.ip,
                            "protocol": self._guess_protocol(proto, port),
                            "port": port, "bytes": byts // max(len(conns), 1),
                            "packets": pkts // max(len(conns), 1),
                            "severity": "Info",
                        }
                        self._packets.appendleft(event)
                        self._stats["protocols"][event["protocol"]] += 1
                        self._stats["src_ips"][c.laddr.ip] += 1
                        self._stats["dst_ips"][c.raddr.ip] += 1
            prev = curr

    def _update_rates(self):
        while self.running:
            time.sleep(2)
            now = time.time()
            dt = now - self._last_time
            if dt > 0:
                delta = self._stats["total_packets"] - self._last_count
                self._stats["packets_per_sec"] = int(delta / dt)
                self._stats["bytes_per_sec"] = int(self._stats["total_bytes"] / max(now - self._last_time, 1))
            self._last_count = self._stats["total_packets"]
            self._last_time = now

    def _guess_protocol(self, base_proto, port):
        port_map = {
            80: "HTTP", 443: "HTTPS", 22: "SSH", 53: "DNS",
            3389: "RDP", 445: "SMB", 139: "SMB", 21: "FTP",
            25: "SMTP", 3306: "MySQL", 5432: "PostgreSQL",
        }
        return port_map.get(port, base_proto)

    def get_recent_packets(self, count=50):
        return list(self._packets)[:count]

    def get_stats(self):
        return {
            "packets_per_sec": self._stats["packets_per_sec"],
            "bytes_per_sec": self._stats["bytes_per_sec"],
            "total_packets": self._stats["total_packets"],
            "total_bytes": self._stats["total_bytes"],
            "protocols": dict(self._stats["protocols"]),
            "top_sources": sorted(self._stats["src_ips"].items(), key=lambda x: -x[1])[:10],
            "top_destinations": sorted(self._stats["dst_ips"].items(), key=lambda x: -x[1])[:10],
        }

    def get_protocol_distribution(self):
        colors = {
            "HTTPS": "#00e5ff", "HTTP": "#7c4dff", "DNS": "#e040fb",
            "SSH": "#00e676", "SMB": "#ff9100", "RDP": "#ff1744",
            "TCP": "#00e5ff", "UDP": "#7c4dff", "Other": "#4a4a6a",
            "FTP": "#ff9100", "SMTP": "#e040fb", "MySQL": "#00e676",
        }
        total = sum(self._stats["protocols"].values()) or 1
        return [
            {"name": k, "value": round(v * 100 / total), "color": colors.get(k, "#4a4a6a")}
            for k, v in sorted(self._stats["protocols"].items(), key=lambda x: -x[1])[:7]
        ]

sniffer = LiveSniffer()
