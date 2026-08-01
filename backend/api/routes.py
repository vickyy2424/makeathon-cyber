"""
REST API Routes — All real data from live services + database.
"""
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database.db import get_db
from services.sniffer import sniffer
from services.threat_engine import threat_engine
from services.honeypot import honeypot
from services.scanner import full_scan, get_local_subnet, port_scan
from services import db_service
import psutil, json
from datetime import datetime

router = APIRouter(prefix="/api")

# ── Dashboard KPIs (real) ──
@router.get("/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    stats = sniffer.get_stats()
    devices = db_service.get_all_devices(db)
    alerts = db_service.get_alerts(db, limit=500)
    blocked = db_service.get_blocked_ips(db)
    net = psutil.net_io_counters()
    active_conns = 0
    try:
        active_conns = len(psutil.net_connections(kind='inet'))
    except:
        pass
    total_alerts = len(alerts)
    critical_alerts = len([a for a in alerts if a.severity == "Critical"])
    risk = min(100, critical_alerts * 15 + total_alerts)
    return {
        "totalDevices": len(devices),
        "activeSessions": active_conns,
        "totalAlerts": total_alerts,
        "packetsPerSec": stats["packets_per_sec"],
        "blockedThreats": len(blocked),
        "riskScore": min(risk, 100),
        "totalBytes": net.bytes_recv + net.bytes_sent,
        "bandwidth": round((net.bytes_recv + net.bytes_sent) / 1024 / 1024, 1),
    }

# ── Devices ──
@router.get("/devices")
async def get_devices(db: Session = Depends(get_db)):
    devices = db_service.get_all_devices(db)
    return {"devices": [_dev_to_dict(d) for d in devices], "total": len(devices)}

@router.post("/scan")
async def start_scan(data: dict = Body({"ip_range": None}), db: Session = Depends(get_db)):
    ip_range = data.get("ip_range")
    db_service.save_log(db, "SCAN", "Info", "system", f"Network scan started: {ip_range or 'auto'}")
    results = await full_scan(ip_range)
    for dev_data in results:
        dev_data["os_version"] = dev_data.get("os_version", "Unknown")
        dev_data["vendor"] = dev_data.get("vendor", "Unknown")
        open_ports = dev_data.get("open_ports", [])
        if isinstance(open_ports, list):
            dev_data["open_ports_list"] = open_ports
        db_service.upsert_device(db, dev_data)
    db_service.save_log(db, "SCAN", "Info", "system", f"Scan complete: {len(results)} devices found")
    return {"status": "completed", "devices_found": len(results), "devices": results}

# ── Traffic (real) ──
@router.get("/traffic")
async def get_traffic():
    packets = sniffer.get_recent_packets(50)
    return {"events": packets}

@router.get("/traffic/stats")
async def get_traffic_stats():
    return sniffer.get_stats()

@router.get("/traffic/protocols")
async def get_protocols():
    return sniffer.get_protocol_distribution()

# ── Alerts (real) ──
@router.get("/alerts")
async def get_alerts(db: Session = Depends(get_db)):
    alerts = threat_engine.get_alerts(50)
    # Also get DB persisted alerts
    db_alerts = db_service.get_alerts(db, 50)
    db_list = [{
        "id": a.id, "timestamp": a.timestamp.isoformat(), "attackName": a.attack_name,
        "mitreId": a.mitre_id, "category": a.category, "severity": a.severity,
        "confidence": a.confidence, "srcIP": a.src_ip, "dstIP": a.dst_ip,
        "port": a.port, "status": a.status, "description": a.description,
    } for a in db_alerts]
    combined = alerts + db_list
    combined.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"alerts": combined[:100], "total": len(combined)}

# ── Kill Chain (real) ──
@router.get("/threats")
async def get_threats():
    return {"killchain": threat_engine.get_killchain()}

# ── Honeypot (real) ──
@router.get("/honeypot")
async def get_honeypot():
    return {"traps": honeypot.get_traps(), "detections": honeypot.get_detections(20)}

@router.post("/honeypot/deploy/{trap_id}")
async def deploy_trap(trap_id: int, db: Session = Depends(get_db)):
    trap = honeypot.deploy_trap(trap_id)
    if trap:
        db_service.save_log(db, "HONEYPOT", "Info", "system", f"Trap deployed: {trap['name']} on :{trap['port']}")
    return {"status": "deployed", "trap": trap}

@router.post("/honeypot/deactivate/{trap_id}")
async def deactivate_trap(trap_id: int, db: Session = Depends(get_db)):
    trap = honeypot.deactivate_trap(trap_id)
    if trap:
        db_service.save_log(db, "HONEYPOT", "Info", "system", f"Trap deactivated: {trap['name']}")
    return {"status": "deactivated", "trap": trap}

@router.get("/honeypot/detections")
async def get_detections():
    return {"detections": honeypot.get_detections(50)}

# ── Logs (real from DB) ──
@router.get("/logs")
async def get_logs(db: Session = Depends(get_db)):
    logs = db_service.get_logs(db, 200)
    return {"logs": [{
        "id": l.id, "timestamp": l.timestamp.isoformat(), "type": l.log_type,
        "severity": l.severity, "source": l.source, "message": l.message,
    } for l in logs]}

# ── Defense (real) ──
@router.post("/defense/block")
async def block_device(data: dict = Body(...), db: Session = Depends(get_db)):
    ip = data.get("ip", "")
    reason = data.get("reason", "Manual block")
    db_service.block_ip(db, ip, reason)
    db_service.save_log(db, "DEFENSE", "High", ip, f"IP blocked: {reason}")
    return {"status": "blocked", "ip": ip}

@router.post("/defense/release")
async def release_device(data: dict = Body(...), db: Session = Depends(get_db)):
    ip = data.get("ip", "")
    db_service.unblock_ip(db, ip)
    db_service.save_log(db, "DEFENSE", "Info", ip, "IP released")
    return {"status": "released", "ip": ip}

@router.get("/defense/blocked")
async def get_blocked(db: Session = Depends(get_db)):
    blocked = db_service.get_blocked_ips(db)
    return {"blocked": [{"ip": b.ip, "reason": b.reason, "blockedAt": b.blocked_at.isoformat()} for b in blocked]}

# ── Settings ──
@router.get("/settings")
async def get_settings(db: Session = Depends(get_db)):
    s = db_service.get_settings(db)
    return {
        "scanInterval": int(s.get("scanInterval", "300")),
        "subnetRange": s.get("subnetRange", "auto"),
        "threatSensitivity": int(s.get("threatSensitivity", "70")),
        "autoQuarantine": s.get("autoQuarantine", "true") == "true",
        "emailAlerts": s.get("emailAlerts", "false") == "true",
        "emailAddress": s.get("emailAddress", ""),
    }

@router.post("/settings")
async def update_settings(data: dict = Body(...), db: Session = Depends(get_db)):
    for k, v in data.items():
        db_service.save_setting(db, k, str(v))
    return {"status": "saved"}

# ── Reports ──
@router.get("/reports")
async def get_reports(db: Session = Depends(get_db)):
    devices = db_service.get_all_devices(db)
    alerts = db_service.get_alerts(db, 500)
    logs = db_service.get_logs(db, 500)
    return {"reports": [
        {"id": 1, "title": "Executive Security Report", "type": "PDF", "size": f"{len(alerts)*2}KB", "date": "Generated daily"},
        {"id": 2, "title": "Device Inventory Export", "type": "CSV", "size": f"{len(devices)*1}KB", "date": "On demand"},
        {"id": 3, "title": "Threat Intelligence Report", "type": "PDF", "size": f"{len(alerts)*3}KB", "date": "Generated weekly"},
        {"id": 4, "title": "System Audit Log", "type": "CSV", "size": f"{len(logs)*1}KB", "date": "On demand"},
    ]}

# ── System Info ──
@router.get("/system")
async def get_system():
    cpu = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    net = psutil.net_io_counters()
    return {
        "cpu_percent": cpu, "memory_percent": mem.percent,
        "memory_used_gb": round(mem.used / 1024**3, 1),
        "net_bytes_sent": net.bytes_sent, "net_bytes_recv": net.bytes_recv,
        "uptime_seconds": int(psutil.boot_time()),
    }

def _dev_to_dict(d):
    return {
        "id": d.id, "ip": d.ip, "mac": d.mac, "hostname": d.hostname,
        "os": d.os_version, "vendor": d.vendor, "riskScore": d.risk_score,
        "status": d.status, "firewallOn": d.firewall_on,
        "antivirusActive": d.antivirus_active,
        "openPorts": d.open_ports.split(",") if d.open_ports else [],
        "vulnerabilities": d.vulnerabilities, "patchesMissing": d.patches_missing,
        "lastSeen": d.last_seen.isoformat() if d.last_seen else "",
        "isQuarantined": d.is_quarantined,
    }
