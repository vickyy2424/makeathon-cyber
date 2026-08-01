from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
import datetime
from database.db import Base

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True, index=True)
    mac = Column(String)
    hostname = Column(String)
    os_version = Column(String, default="Unknown")
    vendor = Column(String, default="Unknown")
    risk_score = Column(Float, default=0)
    status = Column(String, default="Healthy")
    firewall_on = Column(Boolean, default=True)
    antivirus_active = Column(Boolean, default=True)
    open_ports = Column(String, default="")
    vulnerabilities = Column(Integer, default=0)
    patches_missing = Column(Integer, default=0)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    is_quarantined = Column(Boolean, default=False)
    discovery_method = Column(String, default="arp")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    attack_name = Column(String)
    mitre_id = Column(String)
    category = Column(String)
    severity = Column(String)
    confidence = Column(Integer)
    src_ip = Column(String)
    dst_ip = Column(String)
    port = Column(Integer)
    status = Column(String, default="Active")
    description = Column(Text)

class TrafficEvent(Base):
    __tablename__ = "traffic"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    src_ip = Column(String)
    dst_ip = Column(String)
    protocol = Column(String)
    port = Column(Integer)
    size = Column(Integer)
    severity = Column(String, default="Info")

class HoneypotTrap(Base):
    __tablename__ = "honeypot_traps"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    port = Column(Integer, nullable=True)
    trap_type = Column(String)
    deployed = Column(Boolean, default=False)
    hits = Column(Integer, default=0)
    last_hit = Column(DateTime, nullable=True)

class TrapHit(Base):
    __tablename__ = "trap_hits"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    trap_id = Column(Integer)
    trap_name = Column(String)
    attacker_ip = Column(String)
    attacker_port = Column(Integer)
    action = Column(String)
    payload = Column(Text, nullable=True)

class LogEntry(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    log_type = Column(String)
    severity = Column(String)
    source = Column(String)
    message = Column(Text)

class ScanResult(Base):
    __tablename__ = "scan_results"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    ip = Column(String)
    scan_type = Column(String)
    findings = Column(Text)
    risk_score = Column(Float)

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True)
    value = Column(String)

class BlockedIP(Base):
    __tablename__ = "blocked_ips"
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True)
    reason = Column(String)
    blocked_at = Column(DateTime, default=datetime.datetime.utcnow)
