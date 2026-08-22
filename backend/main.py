"""
Lehar AI Backend — FastAPI Application Entry Point
AI-Powered Conversational Interface for ARGO Ocean Data Discovery.
"""

import os
import asyncio
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import pytz

from .services.db import init_db
from .services.anomaly_detector import run_anomaly_scan
from .services.argo_client import fetch_live_argo_profiles
from .services.flc_service import sync_and_get_flcs
from .services.pfz_engine import (
    get_coastal_pfz_lines,
    get_pfz_advisories,
    haversine_km,
    bearing_degrees,
    bearing_to_compass,
)
from .routers import chat, data, anomaly, pfz, satellite, guardian

IST = pytz.timezone('Asia/Kolkata')
SYNC_INTERVAL_SECONDS = int(os.getenv("SYNC_INTERVAL_SECONDS", "900"))


async def perform_argo_sync():
    """Executes a non-blocking dynamic catch-up sync with Argovis."""
    try:
        now_ist = datetime.now(IST).strftime('%Y-%m-%d %H:%M:%S %Z')
        print(f"[{now_ist}] [Ocean Ingestion Engine] Polling Argovis for newly surfaced Indian Ocean floats...")
        new_profiles = await fetch_live_argo_profiles()
        if new_profiles:
            print(f"[Ocean Ingestion Engine] ✨ Ingested {len(new_profiles)} new float profile(s).")
        else:
            print("[Ocean Ingestion Engine] ✓ Up to date. No new float profiles relayed in this window.")
    except Exception as err:
        print(f"[Ocean Ingestion Error]: {err}")


async def background_ocean_sync_task():
    """Continuous polling loop for ARGO floats."""
    await perform_argo_sync()
    while True:
        try:
            await asyncio.sleep(SYNC_INTERVAL_SECONDS)
            await perform_argo_sync()
        except asyncio.CancelledError:
            break
        except Exception as loop_err:
            print(f"[Sync Loop Error]: {loop_err}")
            await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database, calculate baseline anomalies, sync FLC registry, and start sync on startup."""
    print("[Lehar AI] Initializing database...")
    init_db()
    
    print("[Lehar AI] Initializing Fish Landing Centers (FLC) registry...")
    try:
        flcs = sync_and_get_flcs()
        print(f"[Lehar AI] ✓ Loaded {len(flcs)} Fish Landing Centers.")
    except Exception as flc_err:
        print(f"[Lehar AI] FLC initialization note: {flc_err}")

    print("[Lehar AI] Calculating evidence-based anomaly observations...")
    run_anomaly_scan(reset_existing=True, max_profiles=200)
    
    sync_task = asyncio.create_task(background_ocean_sync_task())
    
    interval_mins = int(SYNC_INTERVAL_SECONDS / 60)
    print(f"[Lehar AI] Backend ready with near-real-time Argovis sync active (interval: every {interval_mins} mins)!")
    yield
    print("[Lehar AI] Shutting down...")
    sync_task.cancel()


app = FastAPI(
    title="Lehar AI API",
    description="AI-Powered Conversational Interface for ARGO Ocean Data Discovery and Visualization",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat.router)
app.include_router(data.router)
app.include_router(anomaly.router)
app.include_router(pfz.router)
app.include_router(satellite.router)
app.include_router(guardian.router)


@app.get("/api/ports")
def api_get_ports():
    """Returns all 586 Indian Fish Landing Centers (FLC) and ports."""
    ports = sync_and_get_flcs()
    return {"status": "success", "count": len(ports), "ports": ports}


@app.get("/api/ports/{port_id}/nearest-pfz")
def api_get_nearest_pfz_for_port(port_id: str):
    """Finds the closest PFZ advisory zone from a specific selected port."""
    ports = sync_and_get_flcs()
    port = next((p for p in ports if p["id"] == port_id), None)
    if not port:
        return {"status": "error", "message": "Port not found"}

    pfzs = get_pfz_advisories("all")
    if not pfzs:
        return {"status": "error", "message": "No active PFZ advisories found"}

    closest_pfz = None
    min_dist = float("inf")

    for p in pfzs:
        d = haversine_km(port["lat"], port["lon"], p["latitude"], p["longitude"])
        if d < min_dist:
            min_dist = d
            closest_pfz = p

    bearing = bearing_degrees(port["lat"], port["lon"], closest_pfz["latitude"], closest_pfz["longitude"])
    
    return {
        "status": "success",
        "port": port,
        "nearest_pfz": closest_pfz,
        "distance_km": round(min_dist, 1),
        "bearing_deg": round(bearing, 1),
        "compass": bearing_to_compass(bearing),
    }


@app.get("/api/pfz/lines")
def api_get_coastal_lines():
    """Returns coastal front lines vector data."""
    lines = get_coastal_pfz_lines()
    return {"status": "success", "lines": lines}


@app.post("/api/sync-argo")
async def trigger_manual_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(perform_argo_sync)
    return {"status": "Sync initiated with Argovis API"}


@app.get("/")
async def root():
    return {
        "name": "Lehar AI API",
        "version": "1.0.0",
        "tagline": "Know the Sea. Know the Way.",
        "status": "running",
        "team": "Ctrl Alt Elites",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    from .services.db import get_profile_count, get_unique_float_count
    return {
        "status": "healthy",
        "profiles": get_profile_count(),
        "floats": get_unique_float_count(),
    }