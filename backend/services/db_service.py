"""
Database service — CRUD operations for all models.
"""
from sqlalchemy.orm import Session
from database.models import Device, Alert, LogEntry, TrafficEvent, TrapHit, ScanResult, BlockedIP, Setting
from datetime import datetime

def upsert_device(db: Session, data: dict):
    dev = db.query(Device).filter(Device.ip == data["ip"]).first()
    if dev:
        for k, v in data.items():
            if k != "ip" and hasattr(dev, k):
                setattr(dev, k, v)
        dev.last_seen = datetime.utcnow()
    else:
        dev = Device(
            ip=data["ip"], mac=data.get("mac", "N/A"),
            hostname=data.get("hostname", data["ip"]),
            os_version=data.get("os_version", "Unknown"),
            vendor=data.get("vendor", "Unknown"),
            risk_score=data.get("risk_score", 0),
            status=data.get("status", "Healthy"),
            open_ports=",".join(str(p) for p in data.get("open_ports", [])),
            vulnerabilities=data.get("vulnerabilities", 0),
            discovery_method=data.get("discovery_method", "arp"),
        )
        db.add(dev)
    db.commit()
    return dev

def get_all_devices(db: Session):
    return db.query(Device).order_by(Device.last_seen.desc()).all()

def save_alert(db: Session, data: dict):
    alert = Alert(
        attack_name=data["attackName"], mitre_id=data["mitreId"],
        category=data["category"], severity=data["severity"],
        confidence=data["confidence"], src_ip=data["srcIP"],
        dst_ip=data["dstIP"], port=data.get("port", 0),
        status=data.get("status", "Active"), description=data["description"],
    )
    db.add(alert)
    db.commit()
    return alert

def get_alerts(db: Session, limit=100):
    return db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()

def save_log(db: Session, log_type: str, severity: str, source: str, message: str):
    entry = LogEntry(log_type=log_type, severity=severity, source=source, message=message)
    db.add(entry)
    db.commit()

def get_logs(db: Session, limit=200):
    return db.query(LogEntry).order_by(LogEntry.timestamp.desc()).limit(limit).all()

def save_trap_hit(db: Session, data: dict):
    hit = TrapHit(
        trap_id=data.get("trap_id", 0), trap_name=data["trap"],
        attacker_ip=data["attacker"], attacker_port=data.get("attacker_port", 0),
        action=data.get("action", ""), payload=data.get("payload"),
    )
    db.add(hit)
    db.commit()

def get_trap_hits(db: Session, limit=100):
    return db.query(TrapHit).order_by(TrapHit.timestamp.desc()).limit(limit).all()

def block_ip(db: Session, ip: str, reason: str):
    existing = db.query(BlockedIP).filter(BlockedIP.ip == ip).first()
    if not existing:
        db.add(BlockedIP(ip=ip, reason=reason))
        db.commit()

def unblock_ip(db: Session, ip: str):
    db.query(BlockedIP).filter(BlockedIP.ip == ip).delete()
    db.commit()

def get_blocked_ips(db: Session):
    return db.query(BlockedIP).order_by(BlockedIP.blocked_at.desc()).all()

def save_setting(db: Session, key: str, value: str):
    s = db.query(Setting).filter(Setting.key == key).first()
    if s:
        s.value = value
    else:
        db.add(Setting(key=key, value=value))
    db.commit()

def get_settings(db: Session):
    return {s.key: s.value for s in db.query(Setting).all()}
