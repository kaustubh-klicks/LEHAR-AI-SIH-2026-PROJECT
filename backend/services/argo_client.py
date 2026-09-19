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
DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "argo_indian_ocean.db"))

INDIAN_OCEAN_REGIONS = [
    {"name": "Arabian Sea", "center": (68.0, 18.0), "radius": 1500},
    {"name": "Bay of Bengal", "center": (85.0, 15.0), "radius": 1500},
    {"name": "South India / Malabar", "center": (75.0, 9.0), "radius": 1500},
    {"name": "Equatorial Indian Ocean", "center": (70.0, 0.0), "radius": 1800},
    {"name": "Southern Indian Ocean", "center": (80.0, -15.0), "radius": 2000},
]


def _headers() -> dict:
    """Build request headers with optional API key."""
    headers = {"Accept": "application/json"}
    if ARGOVIS_KEY:
        headers["x-argokey"] = ARGOVIS_KEY
    return headers


def get_latest_profile_timestamp() -> Optional[str]:
    """Checks the local database for the newest recorded profile date."""
    if not os.path.exists(DB_PATH):
        return None
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(date) FROM argo_profiles")
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
    """Search Argo profiles by date range and location."""
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
    """Synchronous version for data ingestion scripts."""
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


def save_profiles_to_db(profiles: list[dict]):
    """Stores raw Argovis profiles into SQLite, tagging the Data Assembly Center (DAC)."""
    if not profiles:
        return

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    inserted_count = 0
    for p in profiles:
        pid = p.get("_id")
        coords = p.get("geolocation", {}).get("coordinates", [None, None])
        lon, lat = coords[0], coords[1]
        date_str = p.get("timestamp")
        cycle = p.get("cycle_number")
        float_id = str(pid).split("_")[0] if pid else None

        if lat is None or lon is None:
            continue

        sources_meta = p.get("source", [])
        dac_name = "Argovis Live Sync"
        for s in sources_meta:
            url_str = s.get("url", "")
            if "dac/incois" in url_str.lower():
                dac_name = "INCOIS"
                break
            elif "dac/" in url_str.lower():
                parts = url_str.lower().split("dac/")
                if len(parts) > 1:
                    dac_name = parts[1].split("/")[0].upper()

        data_keys = p.get("data_info", [[], []])[0]
        raw_matrix = p.get("data", [])
        num_levels = 0
        max_depth = 2000.0

        pressures = []
        temps = []
        sals = []
        if raw_matrix and "pressure" in data_keys:
            p_idx = data_keys.index("pressure")
            t_idx = data_keys.index("temperature") if "temperature" in data_keys else -1
            s_idx = data_keys.index("salinity") if "salinity" in data_keys else -1

            pressures = raw_matrix[p_idx] if p_idx < len(raw_matrix) else []
            temps = raw_matrix[t_idx] if (t_idx >= 0 and t_idx < len(raw_matrix)) else []
            sals = raw_matrix[s_idx] if (s_idx >= 0 and s_idx < len(raw_matrix)) else []
            num_levels = len([pr for pr in pressures if pr is not None])
            valid_p = [pr for pr in pressures if pr is not None]
            if valid_p:
                max_depth = max(valid_p)

        try:
            c.execute("""
                INSERT OR REPLACE INTO argo_profiles 
                (float_id, cycle_number, latitude, longitude, date, max_depth, num_levels, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (float_id, cycle, lat, lon, date_str, max_depth, num_levels, dac_name))

            profile_pk = c.lastrowid

            measurements = []
            for i in range(len(pressures)):
                pres = pressures[i]
                if pres is None:
                    continue
                temp = temps[i] if i < len(temps) else None
                sal = sals[i] if i < len(sals) else None
                measurements.append((profile_pk, pres, pres, temp, sal))

            if measurements:
                c.executemany("""
                    INSERT OR IGNORE INTO argo_measurements
                    (profile_id, pressure, depth, temperature, salinity)
                    VALUES (?, ?, ?, ?, ?)
                """, measurements)

            inserted_count += 1
        except Exception as e:
            print(f"[Ingestion Error] Failed to insert profile {pid}: {e}")

    conn.commit()
    conn.close()
    print(f"[Ingestion Engine] Successfully saved {inserted_count} profiles to {DB_PATH}")


async def fetch_live_argo_profiles(days_back: Optional[int] = None) -> list[dict]:
    """Fetches newly surfaced profiles across the Indian Ocean and writes to SQLite."""
    now = datetime.now(timezone.utc)
    end_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    if days_back is not None:
        start_date = now - timedelta(days=days_back)
        start_str = start_date.strftime("%Y-%m-%dT00:00:00Z")
    else:
        last_sync_date = get_latest_profile_timestamp()
        if last_sync_date:
            start_str = last_sync_date
        else:
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

    if all_live_profiles:
        save_profiles_to_db(all_live_profiles)

    return all_live_profiles