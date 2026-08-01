import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cybershield.db")
SECRET_KEY = os.getenv("SECRET_KEY", "probe-cybershield-360-key")
CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "*"]
SIMULATION_MODE = True
SCAN_INTERVAL = int(os.getenv("SCAN_INTERVAL", "300"))
THREAT_SENSITIVITY = int(os.getenv("THREAT_SENSITIVITY", "70"))
