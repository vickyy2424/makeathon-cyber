"""
PROBE CyberShield 360 — Hackathon Demo Backend
Realistic simulation engine with working attack triggers.
"""
import uvicorn, asyncio, json, random, time, threading
import socketio
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from collections import deque, defaultdict

# ── State ──
state = {
    "devices": [], "alerts": deque(maxlen=200), "logs": deque(maxlen=300),
    "traffic": deque(maxlen=100), "blocked": [], "trap_hits": deque(maxlen=100),
    "kpis": {"totalDevices": 34, "activeSessions": 478, "totalAlerts": 12, "packetsPerSec": 245, "blockedThreats": 3, "riskScore": 42},
    "traps": [
        {"id":1,"name":"SSH Trap","port":2222,"type":"service","icon":"🔒","deployed":True,"hits":23,"lastHit":None},
        {"id":2,"name":"HTTP Login","port":8888,"type":"web","icon":"🌐","deployed":True,"hits":15,"lastHit":None},
        {"id":3,"name":"RTSP Trap","port":554,"type":"camera","icon":"📹","deployed":False,"hits":0,"lastHit":None},
        {"id":4,"name":"API Trap","port":9443,"type":"web","icon":"🔗","deployed":True,"hits":31,"lastHit":None},
        {"id":5,"name":"DB Trap","port":3306,"type":"database","icon":"🗄️","deployed":False,"hits":0,"lastHit":None},
        {"id":6,"name":"Camera Admin","port":80,"type":"admin","icon":"🖥️","deployed":True,"hits":8,"lastHit":None},
        {"id":7,"name":"FTP Trap","port":21,"type":"service","icon":"📁","deployed":False,"hits":0,"lastHit":None},
        {"id":8,"name":"Canary Creds","port":None,"type":"credential","icon":"🔑","deployed":True,"hits":5,"lastHit":None},
    ],
    "killchain": [
        {"stage":"Reconnaissance","mitre":"TA0043","count":7,"active":True,"color":"#7c4dff"},
        {"stage":"Initial Access","mitre":"TA0001","count":3,"active":True,"color":"#00e5ff"},
        {"stage":"Credential Access","mitre":"TA0006","count":5,"active":True,"color":"#e040fb"},
        {"stage":"Lateral Movement","mitre":"TA0008","count":2,"active":False,"color":"#ff9100"},
        {"stage":"Command & Control","mitre":"TA0011","count":4,"active":True,"color":"#ff1744"},
        {"stage":"Exfiltration","mitre":"TA0010","count":1,"active":False,"color":"#ff1744"},
        {"stage":"Impact","mitre":"TA0040","count":0,"active":False,"color":"#ff1744"},
    ],
    "settings": {"scanInterval":"300","subnetRange":"192.168.1.0/24","threatSensitivity":"70","autoQuarantine":"true","emailAlerts":"false"},
    "timeseries": [],
}

# ── Helpers ──
def rip(): return f"{random.choice([87,203,104,198,185,45,91,156,23,77])}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
def iip(): return f"192.168.{random.randint(1,5)}.{random.randint(1,254)}"
def pick(a): return a[random.randint(0,len(a)-1)]
def rmac(): return ':'.join(f'{random.randint(0,255):02X}' for _ in range(6))

ATTACKS = [
    {"name":"Port Scan","mitre":"T1046","cat":"Reconnaissance","sev":"Medium"},
    {"name":"Brute Force SSH","mitre":"T1110.001","cat":"Credential Access","sev":"High"},
    {"name":"DNS Tunneling","mitre":"T1071.004","cat":"Command & Control","sev":"High"},
    {"name":"C2 Beacon","mitre":"T1071.001","cat":"Command & Control","sev":"Critical"},
    {"name":"Data Exfiltration","mitre":"T1041","cat":"Exfiltration","sev":"Critical"},
    {"name":"DDoS Flood","mitre":"T1498","cat":"Impact","sev":"Critical"},
    {"name":"Ransomware Payload","mitre":"T1486","cat":"Impact","sev":"Critical"},
    {"name":"ARP Spoofing","mitre":"T1557","cat":"Credential Access","sev":"High"},
    {"name":"Lateral Movement","mitre":"T1021","cat":"Lateral Movement","sev":"High"},
    {"name":"SQL Injection","mitre":"T1190","cat":"Initial Access","sev":"High"},
]
PROTOS = ['TCP','UDP','HTTP','HTTPS','DNS','SSH','RDP','SMB','ICMP','FTP']
OS_LIST = ['Windows 11 Pro','Windows 10 Enterprise','Windows Server 2022','Ubuntu 22.04','macOS Sonoma']
VENDORS = ['Dell','HP','Lenovo','Cisco','ASUS','Ubiquiti','Hikvision','Synology','Brother']
HOSTS = ['WS-','SRV-','DC-','WEB-','DB-','APP-','FW-','MAIL-','CAM-','NAS-','PRINT-','RTR-']
COUNTRIES = ['Germany','Russia','China','Brazil','Iran','Netherlands','Romania','Vietnam','Ukraine','India']

def init_devices():
    types = [('Windows 11 Pro','Dell',['WS-']),('Windows 10 Enterprise','HP',['WS-']),('Windows Server 2022','Dell',['SRV-','DC-','WEB-','DB-']),
             ('Ubuntu 22.04','Lenovo',['APP-','WEB-']),('Printer Firmware','Brother',['PRINT-']),('RouterOS','Cisco',['RTR-','FW-']),
             ('IP Camera FW','Hikvision',['CAM-']),('DSM 7.2','Synology',['NAS-']),('macOS Sonoma','Apple',['WS-'])]
    devs = []
    for i in range(32):
        t = pick(types)
        risk = random.randint(0,100)
        devs.append({"id":i+1,"ip":f"192.168.{random.randint(1,3)}.{random.randint(1,254)}","mac":rmac(),
            "hostname":pick(t[2])+str(random.randint(100,999)),"os":t[0],"vendor":t[1],
            "riskScore":risk,"status":"Critical" if risk>70 else "Warning" if risk>40 else "Healthy",
            "firewallOn":random.random()>0.15,"antivirusActive":random.random()>0.1,
            "openPorts":random.sample([22,80,135,139,443,445,3389,5985,8080,3306],k=random.randint(1,5)),
            "vulnerabilities":random.randint(0,12),"patchesMissing":random.randint(0,6),
            "lastSeen":datetime.utcnow().isoformat(),"isQuarantined":False})
    return devs

def gen_traffic():
    src = iip() if random.random()>0.3 else rip()
    dst = iip() if random.random()>0.4 else pick(['8.8.8.8','1.1.1.1','13.107.42.14','52.96.166.130','104.18.32.7'])
    proto = pick(PROTOS)
    port = pick([22,80,443,3389,445,53,8080,21,25,3306])
    return {"id":str(time.time())+str(random.random()),"time":datetime.utcnow().isoformat(),"srcIP":src,"dstIP":dst,"protocol":proto,"port":port,"bytes":random.randint(64,65535),"packets":random.randint(1,200),"severity":pick(['Info','Info','Info','Low','Medium'])}

def gen_alert(attack=None):
    a = attack or pick(ATTACKS)
    return {"id":str(time.time())+str(random.random()),"timestamp":datetime.utcnow().isoformat(),"attackName":a["name"],"mitreId":a["mitre"],
        "category":a["cat"],"severity":a["sev"],"confidence":random.randint(65,99),
        "srcIP":rip(),"dstIP":iip(),"port":pick([22,80,443,3389,445,53]),
        "status":pick(["Active","Investigating","Contained"]),"description":f"Detected {a['name']} activity targeting internal infrastructure."}

def gen_log(typ="THREAT",sev="Medium",src=None,msg=None):
    return {"id":str(time.time()),"timestamp":datetime.utcnow().isoformat(),"type":typ,"severity":sev,"source":src or iip(),
        "message":msg or pick(["Port scan detected","Firewall rule triggered","Brute force detected","DNS anomaly blocked","Honeypot interaction","Device quarantined","ARP spoofing detected","Credential access attempt","Suspicious outbound traffic","TOR exit node traffic detected"])}

# ── Init ──
state["devices"] = init_devices()
for _ in range(15): state["alerts"].appendleft(gen_alert())
for _ in range(40): state["logs"].appendleft(gen_log(pick(['AUTH','NETWORK','SYSTEM','THREAT','HONEYPOT','SCAN','DEFENSE']),pick(['Critical','High','Medium','Low','Info'])))
for i in range(24):
    state["timeseries"].append({"time":(datetime.utcnow()-timedelta(hours=23-i)).strftime("%I:%M %p"),"events":random.randint(100,600),"alerts":random.randint(2,25),"traffic":random.randint(500,2500)})

# ── Socket.IO ──
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

@asynccontextmanager
async def lifespan(app):
    print("\n" + "="*60)
    print("  PROBE CyberShield 360 — HACKATHON DEMO")
    print("  API: http://localhost:8000/docs")
    print("  WS:  ws://localhost:8000/socket.io")
    print("="*60 + "\n")
    task = asyncio.create_task(bg_loop())
    yield
    task.cancel()

app = FastAPI(title="PROBE CyberShield 360", version="3.0.0-demo", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
sio_app = socketio.ASGIApp(sio, app)

@sio.event
async def connect(sid, env): await sio.emit('connection_status',{'status':'connected','mode':'DEMO'},to=sid)
@sio.event
async def disconnect(sid): pass

# ── Background loop ──
async def bg_loop():
    tick = 0
    while True:
        try:
            # Traffic
            evt = gen_traffic()
            state["traffic"].appendleft(evt)
            await sio.emit('live_traffic', evt)
            # KPIs nudge
            k = state["kpis"]
            k["activeSessions"] = max(120, min(950, k["activeSessions"] + random.randint(-15, 15)))
            k["packetsPerSec"] = max(20, min(600, k["packetsPerSec"] + random.randint(-20, 20)))
            k["totalAlerts"] = len(state["alerts"])
            k["totalDevices"] = len(state["devices"])
            k["blockedThreats"] = len(state["blocked"])
            crit = len([a for a in state["alerts"] if a["severity"]=="Critical"])
            k["riskScore"] = min(100, 20 + crit*8 + len(state["blocked"])*3)
            await sio.emit('kpi_update', k)
            # Timeseries
            if tick % 5 == 0:
                last = state["timeseries"][-1]
                state["timeseries"].append({"time":datetime.utcnow().strftime("%I:%M:%S %p"),"events":max(50,min(700,last["events"]+random.randint(-30,30))),"alerts":max(0,min(40,last["alerts"]+random.randint(-2,2))),"traffic":max(200,min(3000,last["traffic"]+random.randint(-100,100)))})
                state["timeseries"] = state["timeseries"][-30:]
                await sio.emit('timeseries_update', state["timeseries"])
            # Occasional alert
            if tick % 8 == 0:
                alert = gen_alert()
                state["alerts"].appendleft(alert)
                state["logs"].appendleft(gen_log("THREAT",alert["severity"],alert["srcIP"],f"{alert['attackName']} from {alert['srcIP']}"))
                await sio.emit('live_alert', alert)
            # Occasional trap hit
            if tick % 12 == 0:
                deployed = [t for t in state["traps"] if t["deployed"]]
                if deployed:
                    trap = pick(deployed)
                    trap["hits"] += 1
                    trap["lastHit"] = datetime.utcnow().isoformat()
                    det = {"time":datetime.utcnow().isoformat(),"attacker":rip(),"trap":trap["name"],"action":pick(["Login attempt","API enumeration","Brute force","SQL injection","Credential stuffing"]),"creds":pick([None,None,"root/admin123","admin/password","svc_backup/Summer2024!"]),"country":pick(COUNTRIES)}
                    state["trap_hits"].appendleft(det)
                    state["logs"].appendleft(gen_log("HONEYPOT","High",det["attacker"],f"Trap hit: {trap['name']} from {det['attacker']}"))
                    await sio.emit('trap_detection', det)
            # Protocol dist
            if tick % 6 == 0:
                proto = [{"name":"HTTPS","value":random.randint(30,45),"color":"#00e5ff"},{"name":"HTTP","value":random.randint(12,22),"color":"#7c4dff"},{"name":"DNS","value":random.randint(8,18),"color":"#e040fb"},{"name":"SSH","value":random.randint(4,12),"color":"#00e676"},{"name":"SMB","value":random.randint(2,8),"color":"#ff9100"},{"name":"RDP","value":random.randint(1,6),"color":"#ff1744"},{"name":"Other","value":random.randint(3,10),"color":"#4a4a6a"}]
                await sio.emit('protocol_update', proto)
            # Killchain
            if tick % 10 == 0:
                await sio.emit('killchain_update', state["killchain"])
            tick += 1
        except Exception as e:
            print(f"[BG] {e}")
        await asyncio.sleep(2)

# ═══ ROUTES ═══
from fastapi import APIRouter
router = APIRouter(prefix="/api")

@router.get("/dashboard")
async def dashboard(): return state["kpis"]

@router.get("/dashboard/timeseries")
async def timeseries(): return state["timeseries"]

@router.get("/devices")
async def devices(): return {"devices":state["devices"],"total":len(state["devices"])}

@router.post("/scan")
async def scan(data:dict=Body({"ip_range":"192.168.1.0/24"})):
    new = []
    for _ in range(random.randint(3,8)):
        d = {"id":len(state["devices"])+len(new)+1,"ip":iip(),"mac":rmac(),"hostname":pick(HOSTS)+str(random.randint(100,999)),"os":pick(OS_LIST),"vendor":pick(VENDORS),"riskScore":random.randint(0,100),"status":"Healthy","firewallOn":True,"antivirusActive":True,"openPorts":[80,443],"vulnerabilities":0,"patchesMissing":0,"lastSeen":datetime.utcnow().isoformat(),"isQuarantined":False}
        d["status"]="Critical" if d["riskScore"]>70 else "Warning" if d["riskScore"]>40 else "Healthy"
        new.append(d)
    state["devices"].extend(new)
    state["logs"].appendleft(gen_log("SCAN","Info","system",f"Scan complete: {len(new)} new devices found"))
    return {"status":"completed","devices_found":len(new),"devices":new}

@router.get("/alerts")
async def alerts(): return {"alerts":list(state["alerts"])[:100],"total":len(state["alerts"])}

@router.get("/traffic")
async def traffic(): return {"events":list(state["traffic"])[:50]}

@router.get("/traffic/stats")
async def tstats():
    srcs = defaultdict(int)
    dsts = defaultdict(int)
    for t in state["traffic"]:
        srcs[t["srcIP"]] += 1
        dsts[t["dstIP"]] += 1
    return {"packets_per_sec":state["kpis"]["packetsPerSec"],"total_packets":len(state["traffic"])*100,"bytes_per_sec":state["kpis"]["packetsPerSec"]*512,
        "top_sources":sorted(srcs.items(),key=lambda x:-x[1])[:10],"top_destinations":sorted(dsts.items(),key=lambda x:-x[1])[:10],
        "protocols":{"HTTPS":random.randint(30,45),"HTTP":random.randint(12,20),"DNS":random.randint(8,15),"SSH":random.randint(3,10),"SMB":random.randint(2,8),"RDP":random.randint(1,5),"Other":random.randint(3,8)}}

@router.get("/traffic/protocols")
async def protos():
    return [{"name":"HTTPS","value":38,"color":"#00e5ff"},{"name":"HTTP","value":18,"color":"#7c4dff"},{"name":"DNS","value":14,"color":"#e040fb"},{"name":"SSH","value":8,"color":"#00e676"},{"name":"SMB","value":6,"color":"#ff9100"},{"name":"RDP","value":4,"color":"#ff1744"},{"name":"Other","value":7,"color":"#4a4a6a"}]

@router.get("/threats")
async def threats(): return {"killchain":state["killchain"]}

@router.get("/honeypot")
async def honeypot(): return {"traps":state["traps"],"detections":list(state["trap_hits"])[:30]}

@router.post("/honeypot/deploy/{tid}")
async def deploy(tid:int):
    for t in state["traps"]:
        if t["id"]==tid: t["deployed"]=True; state["logs"].appendleft(gen_log("HONEYPOT","Info","system",f"Deployed {t['name']}")); return {"status":"deployed","trap":t}

@router.post("/honeypot/deactivate/{tid}")
async def deactivate(tid:int):
    for t in state["traps"]:
        if t["id"]==tid: t["deployed"]=False; return {"status":"deactivated","trap":t}

@router.get("/honeypot/detections")
async def detections(): return {"detections":list(state["trap_hits"])[:50]}

@router.get("/logs")
async def logs(): return {"logs":list(state["logs"])[:200]}

@router.post("/defense/block")
async def block(data:dict=Body(...)): 
    ip=data.get("ip",""); state["blocked"].append({"ip":ip,"reason":data.get("reason","Manual"),"blockedAt":datetime.utcnow().isoformat()})
    state["logs"].appendleft(gen_log("DEFENSE","High",ip,f"Blocked: {ip}")); return {"status":"blocked","ip":ip}

@router.post("/defense/release")
async def release(data:dict=Body(...)): 
    ip=data.get("ip",""); state["blocked"]=[b for b in state["blocked"] if b["ip"]!=ip]
    state["logs"].appendleft(gen_log("DEFENSE","Info",ip,f"Released: {ip}")); return {"status":"released","ip":ip}

@router.get("/defense/blocked")
async def blocked(): return {"blocked":state["blocked"]}

@router.get("/settings")
async def settings(): 
    s=state["settings"]; return {"scanInterval":int(s.get("scanInterval","300")),"subnetRange":s.get("subnetRange","192.168.1.0/24"),"threatSensitivity":int(s.get("threatSensitivity","70")),"autoQuarantine":s.get("autoQuarantine","true")=="true","emailAlerts":s.get("emailAlerts","false")=="true"}

@router.post("/settings")
async def save_settings(data:dict=Body(...)): state["settings"].update({k:str(v) for k,v in data.items()}); return {"status":"saved"}

@router.get("/reports")
async def reports():
    return {"reports":[
        {"id":1,"title":"Executive Security Report","type":"PDF","size":"2.4 MB","date":"Generated daily"},
        {"id":2,"title":"Incident Response Report","type":"PDF","size":"1.8 MB","date":"Per incident"},
        {"id":3,"title":"Threat Intelligence Report","type":"PDF","size":"3.1 MB","date":"Generated weekly"},
        {"id":4,"title":"Device Inventory Export","type":"CSV","size":"856 KB","date":"On demand"},
        {"id":5,"title":"Vulnerability Assessment","type":"PDF","size":"4.2 MB","date":"Generated weekly"},
        {"id":6,"title":"Network Traffic Analysis","type":"CSV","size":"12.5 MB","date":"On demand"},
        {"id":7,"title":"Compliance Audit Report","type":"PDF","size":"5.8 MB","date":"Generated monthly"},
        {"id":8,"title":"Honeypot Intelligence","type":"PDF","size":"1.2 MB","date":"Generated weekly"},
    ]}

# ═══ SIMULATE ATTACK ═══
@router.post("/simulate")
async def simulate_attack(data:dict=Body(...)):
    attack_type = data.get("attack","Port Scan")
    attack = next((a for a in ATTACKS if a["name"]==attack_type), ATTACKS[0])
    # Generate burst of alerts
    for _ in range(random.randint(3,8)):
        alert = gen_alert(attack)
        alert["severity"] = attack["sev"]
        state["alerts"].appendleft(alert)
        await sio.emit('live_alert', alert)
    # Update kill chain
    cat_map = {"Reconnaissance":"Reconnaissance","Initial Access":"Initial Access","Credential Access":"Credential Access",
        "Lateral Movement":"Lateral Movement","Command & Control":"Command & Control","Exfiltration":"Exfiltration","Impact":"Impact"}
    for kc in state["killchain"]:
        if kc["stage"] == cat_map.get(attack["cat"], attack["cat"]):
            kc["count"] += random.randint(2,5); kc["active"] = True
    await sio.emit('killchain_update', state["killchain"])
    # Spike traffic
    state["kpis"]["packetsPerSec"] = min(600, state["kpis"]["packetsPerSec"] + random.randint(50,200))
    for _ in range(10):
        evt = gen_traffic()
        evt["severity"] = pick(["High","Medium","Critical"])
        state["traffic"].appendleft(evt)
        await sio.emit('live_traffic', evt)
    # Log
    state["logs"].appendleft(gen_log("THREAT",attack["sev"],rip(),f"SIMULATION: {attack['name']} attack launched"))
    await sio.emit('kpi_update', state["kpis"])
    await sio.emit('simulation_event', {"attack":attack_type,"severity":attack["sev"],"message":f"{attack['name']} simulation triggered"})
    return {"status":"triggered","attack":attack_type,"alerts_generated":True}

app.include_router(router)

@app.get("/")
async def root(): return {"platform":"PROBE CyberShield 360","version":"3.0.0","mode":"HACKATHON DEMO","status":"operational"}

if __name__ == "__main__":
    uvicorn.run(sio_app, host="0.0.0.0", port=8000, log_level="info")
