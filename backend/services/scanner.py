"""
Real Network Scanner — ARP scan, ping sweep, hostname + MAC detection.
Uses subprocess for maximum compatibility (no Npcap requirement).
"""
import subprocess, re, socket, asyncio, platform
from datetime import datetime

async def arp_scan() -> list:
    """Parse local ARP table for discovered devices."""
    devices = []
    try:
        result = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=10)
        for line in result.stdout.splitlines():
            m = re.search(r'(\d+\.\d+\.\d+\.\d+)\s+([\w-]+(?::[\w-]+)+|[\w-]+(?:-[\w-]+)+)', line)
            if m:
                ip = m.group(1)
                mac = m.group(2).replace('-', ':').upper()
                if ip.startswith('224.') or ip.endswith('.255') or ip == '255.255.255.255':
                    continue
                hostname = await _resolve_hostname(ip)
                devices.append({
                    "ip": ip, "mac": mac, "hostname": hostname,
                    "last_seen": datetime.utcnow().isoformat(),
                    "discovery_method": "arp",
                })
    except Exception as e:
        print(f"[Scanner] ARP scan error: {e}")
    return devices

async def ping_sweep(subnet: str) -> list:
    """Ping sweep a /24 subnet to discover live hosts."""
    base = '.'.join(subnet.split('.')[:3])
    live = []
    tasks = []
    for i in range(1, 255):
        ip = f"{base}.{i}"
        tasks.append(_ping_host(ip))
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for ip_result in results:
        if ip_result and isinstance(ip_result, str):
            live.append(ip_result)
    return live

async def _ping_host(ip: str):
    """Ping a single host, return IP if alive."""
    try:
        param = "-n" if platform.system().lower() == "windows" else "-c"
        proc = await asyncio.create_subprocess_exec(
            "ping", param, "1", "-w", "500", ip,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL
        )
        await asyncio.wait_for(proc.wait(), timeout=2)
        if proc.returncode == 0:
            return ip
    except:
        pass
    return None

async def _resolve_hostname(ip: str) -> str:
    """Try reverse DNS lookup."""
    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, socket.gethostbyaddr, ip), timeout=2
        )
        return result[0]
    except:
        return ip

async def get_local_ip() -> str:
    """Get local machine IP."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

async def get_local_subnet() -> str:
    """Get local subnet base."""
    ip = await get_local_ip()
    return '.'.join(ip.split('.')[:3]) + '.0/24'

async def port_scan(ip: str, ports: list = None) -> list:
    """Quick TCP connect scan on common ports."""
    if ports is None:
        ports = [22, 80, 135, 139, 443, 445, 3306, 3389, 5432, 5985, 8080, 8443]
    open_ports = []
    for port in ports:
        try:
            conn = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(conn, timeout=0.5)
            writer.close()
            await writer.wait_closed()
            open_ports.append(port)
        except:
            pass
    return open_ports

async def full_scan(ip_range: str = None) -> list:
    """Full scan: ARP + ping sweep + port scan + hostname resolution."""
    if ip_range is None:
        ip_range = await get_local_subnet()

    base = ip_range.replace('/24', '').rsplit('.', 1)[0]

    # Step 1: ARP table
    arp_devices = await arp_scan()
    known_ips = {d["ip"] for d in arp_devices}

    # Step 2: Ping sweep for more
    live_ips = await ping_sweep(base + ".0")
    for ip in live_ips:
        if ip not in known_ips:
            hostname = await _resolve_hostname(ip)
            arp_devices.append({
                "ip": ip, "mac": "N/A", "hostname": hostname,
                "last_seen": datetime.utcnow().isoformat(),
                "discovery_method": "ping",
            })

    # Step 3: Port scan each
    for dev in arp_devices:
        try:
            open_ports = await port_scan(dev["ip"])
            dev["open_ports"] = open_ports
            # Risk score: more open ports = higher risk
            risk = min(len(open_ports) * 12, 100)
            if 3389 in open_ports: risk = min(risk + 20, 100)
            if 445 in open_ports: risk = min(risk + 10, 100)
            dev["risk_score"] = risk
            dev["status"] = "Critical" if risk > 70 else "Warning" if risk > 40 else "Healthy"
            dev["vulnerabilities"] = len(open_ports)
        except Exception:
            dev["open_ports"] = []
            dev["risk_score"] = 0
            dev["status"] = "Healthy"
            dev["vulnerabilities"] = 0

    return arp_devices
