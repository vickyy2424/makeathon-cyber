"""
Real Honeypot Engine — TCP socket listeners on configurable ports.
Logs all connection attempts with attacker IP, port, and payload.
"""
import socket, threading, time, asyncio
from datetime import datetime
from collections import deque

class RealHoneypot:
    def __init__(self):
        self.traps = [
            {"id": 1, "name": "SSH Trap", "port": 2222, "type": "service", "icon": "🔒", "deployed": False, "hits": 0, "lastHit": None},
            {"id": 2, "name": "HTTP Login", "port": 8888, "type": "web", "icon": "🌐", "deployed": False, "hits": 0, "lastHit": None},
            {"id": 3, "name": "RTSP Trap", "port": 5540, "type": "camera", "icon": "📹", "deployed": False, "hits": 0, "lastHit": None},
            {"id": 4, "name": "API Trap", "port": 9443, "type": "web", "icon": "🔗", "deployed": False, "hits": 0, "lastHit": None},
            {"id": 5, "name": "DB Trap", "port": 13306, "type": "database", "icon": "🗄️", "deployed": False, "hits": 0, "lastHit": None},
            {"id": 6, "name": "FTP Trap", "port": 2121, "type": "service", "icon": "📁", "deployed": False, "hits": 0, "lastHit": None},
            {"id": 7, "name": "Telnet Trap", "port": 2323, "type": "service", "icon": "🖥️", "deployed": False, "hits": 0, "lastHit": None},
            {"id": 8, "name": "SMB Trap", "port": 4450, "type": "service", "icon": "📂", "deployed": False, "hits": 0, "lastHit": None},
        ]
        self.detections = deque(maxlen=200)
        self._servers = {}
        self._lock = threading.Lock()
        self._on_detection = None

    def set_callback(self, cb):
        self._on_detection = cb

    def get_traps(self):
        return self.traps

    def deploy_trap(self, trap_id: int):
        trap = next((t for t in self.traps if t["id"] == trap_id), None)
        if not trap or trap["deployed"]:
            return trap
        trap["deployed"] = True
        self._start_listener(trap)
        return trap

    def deactivate_trap(self, trap_id: int):
        trap = next((t for t in self.traps if t["id"] == trap_id), None)
        if not trap:
            return trap
        trap["deployed"] = False
        if trap_id in self._servers:
            try:
                self._servers[trap_id].close()
            except:
                pass
            del self._servers[trap_id]
        return trap

    def _start_listener(self, trap):
        def listener():
            try:
                srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                srv.settimeout(2)
                srv.bind(("0.0.0.0", trap["port"]))
                srv.listen(5)
                self._servers[trap["id"]] = srv
                print(f"[Honeypot] {trap['name']} listening on :{trap['port']}")
                while trap["deployed"]:
                    try:
                        conn, addr = srv.accept()
                        threading.Thread(target=self._handle_conn, args=(trap, conn, addr), daemon=True).start()
                    except socket.timeout:
                        continue
                    except OSError:
                        break
            except OSError as e:
                print(f"[Honeypot] Cannot bind {trap['name']} on :{trap['port']}: {e}")
                trap["deployed"] = False

        t = threading.Thread(target=listener, daemon=True)
        t.start()

    def _handle_conn(self, trap, conn, addr):
        attacker_ip, attacker_port = addr
        payload = ""
        try:
            # Send a banner based on trap type
            banners = {
                "service": b"SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.4\r\n",
                "web": b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html><body><h1>Login</h1><form><input name='user'/><input name='pass' type='password'/></form></body></html>",
                "camera": b"RTSP/1.0 200 OK\r\nCSeq: 1\r\n\r\n",
                "database": b"J\x00\x00\x005.7.38-log\x00",
            }
            banner = banners.get(trap["type"], b"220 Service Ready\r\n")
            conn.sendall(banner)
            conn.settimeout(5)
            data = conn.recv(4096)
            payload = data.decode("utf-8", errors="replace")[:500]
        except:
            pass
        finally:
            try:
                conn.close()
            except:
                pass

        with self._lock:
            trap["hits"] += 1
            trap["lastHit"] = datetime.utcnow().isoformat()
            detection = {
                "time": datetime.utcnow().isoformat(),
                "attacker": attacker_ip,
                "attacker_port": attacker_port,
                "trap": trap["name"],
                "trap_id": trap["id"],
                "action": f"Connection to {trap['name']}",
                "payload": payload if payload else None,
                "creds": self._extract_creds(payload),
            }
            self.detections.appendleft(detection)
            print(f"[Honeypot] HIT: {attacker_ip}:{attacker_port} -> {trap['name']}")
            if self._on_detection:
                self._on_detection(detection)

    def _extract_creds(self, payload):
        if not payload:
            return None
        import re
        patterns = [
            r'(?:user|login|username)[=: ]+(\S+)',
            r'(?:pass|password|pwd)[=: ]+(\S+)',
        ]
        found = []
        for p in patterns:
            m = re.search(p, payload, re.IGNORECASE)
            if m:
                found.append(m.group(1))
        return '/'.join(found) if found else None

    def get_detections(self, limit=50):
        return list(self.detections)[:limit]

    def deploy_all(self):
        for trap in self.traps:
            if not trap["deployed"]:
                self.deploy_trap(trap["id"])

honeypot = RealHoneypot()
