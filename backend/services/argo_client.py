"""
Lehar AI Backend — Argovis API Client
Fetches real ARGO float profiles and CTD measurements from Argovis REST API.
"""

import httpx
import os
import json
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

ARGOVIS_BASE = "https://argovis-api.colorado.edu"
ARGOVIS_KEY = os.getenv("ARGOVIS_API_KEY", "").strip()
DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "lehar.db"))

# 5 Regional Centers covering the entire Indian Ocean basin
INDIAN_OCEAN_REGIONS = [
    {"name": "Arabian Sea", "center": (68.0, 18.0), "radius": 600},
    {"name": "Bay of Bengal", "center": (85.0, 15.0), "radius": 600},
    {"name": "South India / Malabar", "center": (75.0, 9.0), "radius": 500},
    {"name": "Equatorial Indian Ocean", "center": (70.0, 0.0), "radius": 600},
    {"name": "Southern Indian Ocean", "center": (80.0, -15.0), "radius": 600},
]


def _headers() -> dict:
    """Build request headers with optional API key."""
    headers = {"Accept": "application/json"}
    if ARGOVIS_KEY:
        headers["x-argokey"] = ARGOVIS_KEY
    return headers


def get_latest_profile_timestamp() -> Optional[str]:
    """
    Checks the local database for the newest recorded profile date.
    Returns ISO 8601 string or None if empty.
    """
    if not os.path.exists(DB_PATH):
        return None
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(date) FROM profiles")
        row = cursor.fetchone()
        conn.close()
        if row and row[0]:
            return str(row[0])
    except Exception as e:
        print(f"[DB Warning] Could not fetch max profile date: {e}")
    return None


async def search_profiles(
    start_date: str,
    end_date: str,
    polygon: list[list[float]] | None = None,
    center: tuple[float, float] | None = None,
    radius: float = 100,
) -> list[dict]:
    """
    Search Argo profiles by date range and location.
    
    Args:
        start_date: ISO 8601 start date
        end_date: ISO 8601 end date  
        polygon: List of [lon, lat] coordinates defining search area
        center: (lat, lon) tuple for circular search
        radius: Radius in km for circular search
    """
    params = {
        "startDate": start_date,
        "endDate": end_date,
        "data": "all",
    }

    if polygon:
        params["polygon"] = json.dumps(polygon)
    elif center:
        params["center"] = f"{center[0]},{center[1]}"
        params["radius"] = str(radius)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(
            f"{ARGOVIS_BASE}/argo",
            params=params,
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()


async def get_profile_by_id(profile_id: str) -> dict:
    """Get a specific Argo profile by its ID."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{ARGOVIS_BASE}/argo/{profile_id}",
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()


def search_profiles_sync(
    start_date: str,
    end_date: str,
    center_lat: float = 0,
    center_lon: float = 75,
    radius: float = 500,
) -> list[dict]:
    """
    Synchronous version for data ingestion scripts.
    """
    params = {
        "startDate": start_date,
        "endDate": end_date,
        "center": f"{center_lat},{center_lon}",
        "radius": str(radius),
        "data": "all",
    }

    with httpx.Client(timeout=120.0) as client:
        response = client.get(
            f"{ARGOVIS_BASE}/argo",
            params=params,
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()


async def fetch_live_argo_profiles(days_back: Optional[int] = None) -> list[dict]:
    """
    Fetches newly surfaced in-situ float profiles across the 5 Indian Ocean
    regional sectors. Dynamically syncs from the latest database timestamp
    or a configurable time window instead of a hardcoded 48-hour cutoff.
    """
    now = datetime.now(timezone.utc)
    end_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    if days_back is not None:
        start_date = now - timedelta(days=days_back)
        start_str = start_date.strftime("%Y-%m-%dT00:00:00Z")
    else:
        # Check last timestamp in local DB
        last_sync_date = get_latest_profile_timestamp()
        if last_sync_date:
            start_str = last_sync_date
        else:
            # Fallback baseline: 14 days to capture full 10-day float cycles
            start_str = (now - timedelta(days=14)).strftime("%Y-%m-%dT00:00:00Z")

    all_live_profiles: list[dict] = []
    seen_ids = set()

    for region in INDIAN_OCEAN_REGIONS:
        try:
            profiles = await search_profiles(
                start_date=start_str,
                end_date=end_str,
                center=region["center"],
                radius=region["radius"],
            )
            if isinstance(profiles, list):
                for p in profiles:
                    pid = p.get("_id")
                    if pid and pid not in seen_ids:
                        seen_ids.add(pid)
                        all_live_profiles.append(p)
        except Exception as e:
            print(f"[Argo Sync Warning] Sector {region['name']} skip: {e}")
            continue

    return all_live_profiles