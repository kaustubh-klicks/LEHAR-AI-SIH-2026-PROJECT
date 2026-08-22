"""
Lehar AI — PFZ (Potential Fishing Zone) Multi-Sensor Fusion Advisory Engine
Calculates high-probability pelagic fish aggregation zones by fusing:
1. INCOIS ARGO Subsurface Data (Mixed Layer Depth & Vertical Gradient down to 2000m)
2. NOAA Satellite Sea Surface Temperature (1km Ultra-high Resolution)
3. NASA VIIRS Satellite Chlorophyll-a Ocean Color (Bio-productivity & Nutrient Fronts)
"""

from __future__ import annotations
import json
import math
import os
from .db import get_connection
from .satellite_client import get_nearest_satellite_data

FLC_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "flc_centers.json")

# Fallback harbours if JSON is uninitialized
DEFAULT_HARBOURS = [
    ("Ratnagiri, Maharashtra", 16.99, 73.30),
    ("Mumbai (Sassoon Dock)", 18.91, 72.83),
    ("Porbandar, Gujarat", 21.64, 69.61),
    ("Mangalore, Karnataka", 12.87, 74.84),
    ("Kochi (Cochin), Kerala", 9.97, 76.27),
    ("Tuticorin, Tamil Nadu", 8.76, 78.14),
    ("Chennai (Royapuram)", 13.12, 80.30),
    ("Visakhapatnam, AP", 17.69, 83.22),
    ("Paradip, Odisha", 20.32, 86.61),
    ("Goa (Panaji)", 15.50, 73.81),
    ("Veraval, Gujarat", 20.90, 70.37),
    ("Digha, West Bengal", 21.62, 87.51),
]

# Coastal Thermal & Chlorophyll Front Lines (SAMUDRA Vector Curvature)
COASTAL_SECTOR_LINES = [
    {
        "id": "line-mh-01",
        "sector": "Maharashtra & Konkan Shelf",
        "species": ["Surmai (King Mackerel)", "Pomfret (Paplet)", "Bangda (Mackerel)", "Rawas"],
        "coordinates": [
            [19.40, 72.25], [19.05, 72.35], [18.60, 72.50],
            [18.10, 72.65], [17.30, 72.85], [16.40, 73.15], [15.60, 73.45]
        ],
        "sst_celsius": 27.8,
        "chl_a": 0.88,
        "depth_range_m": "25 - 65 m",
        "advisory": "High-density thermal front corridor along the 30-50m shelf break. Prime grounds for Surmai and Pomfret."
    },
    {
        "id": "line-gj-01",
        "sector": "Saurashtra / Gujarat Coast",
        "species": ["Pomfret (Paplet)", "Surmai (King Mackerel)", "Hilsa (Ilish)", "Bangda"],
        "coordinates": [
            [22.20, 68.70], [21.60, 69.15], [20.75, 70.05], [20.35, 71.20], [20.70, 72.15]
        ],
        "sst_celsius": 27.2,
        "chl_a": 1.15,
        "depth_range_m": "20 - 45 m",
        "advisory": "Wide shelf chlorophyll boundary. Highly favorable for Silver Pomfret and King Mackerel."
    },
    {
        "id": "line-kl-01",
        "sector": "Malabar Coast (Kerala & Karnataka)",
        "species": ["Tarli (Sardine)", "Bangda (Mackerel)", "Coastal Tuna", "Surmai"],
        "coordinates": [
            [13.40, 74.20], [12.40, 74.60], [11.30, 75.20], [9.90, 75.75], [8.70, 76.45]
        ],
        "sst_celsius": 26.9,
        "chl_a": 1.30,
        "depth_range_m": "30 - 70 m",
        "advisory": "Active coastal upwelling zone with dense phytoplankton. Peak aggregations of Tarli and Bangda."
    },
    {
        "id": "line-ap-01",
        "sector": "Andhra & Coromandel Coast",
        "species": ["Surmai (King Mackerel)", "Rawas (Indian Salmon)", "Pomfret", "Yellowfin Tuna"],
        "coordinates": [
            [18.30, 84.15], [17.50, 83.15], [16.60, 82.25], [15.60, 80.65], [13.50, 80.35]
        ],
        "sst_celsius": 28.1,
        "chl_a": 0.95,
        "depth_range_m": "35 - 80 m",
        "advisory": "River discharge convergence front. Favorable for King Mackerel and Threadfin Salmon."
    },
    {
        "id": "line-wb-01",
        "sector": "Odisha & Bengal Coast",
        "species": ["Hilsa (Ilish)", "Pomfret (Paplet)", "Bhetki", "Rawas"],
        "coordinates": [
            [21.85, 88.25], [21.35, 87.65], [20.65, 86.95], [19.85, 85.85]
        ],
        "sst_celsius": 27.5,
        "chl_a": 1.65,
        "depth_range_m": "15 - 40 m",
        "advisory": "Ganges-Mahanadi nutrient runoff zone. Peak Hilsa aggregation corridor."
    }
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine great-circle distance in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def bearing_degrees(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Initial bearing from point 1 to point 2 in degrees."""
    dlon = math.radians(lon2 - lon1)
    x = math.sin(dlon) * math.cos(math.radians(lat2))
    y = math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) - math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dlon)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def bearing_to_compass(deg: float) -> str:
    """Convert bearing degrees to compass direction."""
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return dirs[round(deg / 22.5) % 16]


def get_coastal_pfz_lines() -> list[dict]:
    """Returns vector line data for coastal front corridors."""
    return COASTAL_SECTOR_LINES


def nearest_harbour(lat: float, lon: float) -> dict:
    """Find the nearest landing center using the authoritative 586 FLC directory."""
    flc_candidates = []
    if os.path.exists(FLC_FILE):
        try:
            with open(FLC_FILE, "r", encoding="utf-8") as f:
                flc_list = json.load(f)
                for item in flc_list:
                    flc_candidates.append((item.get("name", "Landing Port"), float(item["lat"]), float(item["lon"])))
        except Exception:
            pass

    if not flc_candidates:
        flc_candidates = DEFAULT_HARBOURS

    best = None
    for name, hlat, hlon in flc_candidates:
        dist = haversine_km(lat, lon, hlat, hlon)
        if best is None or dist < best["distance_km"]:
            brg = bearing_degrees(hlat, hlon, lat, lon)
            best = {
                "harbour": name,
                "distance_km": round(dist, 1),
                "bearing_deg": round(brg, 1),
                "compass": bearing_to_compass(brg),
            }
    return best


def compute_mld(profile_id: int) -> float:
    """Compute Mixed Layer Depth from argo_measurements."""
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT depth, temperature FROM argo_measurements
            WHERE profile_id = ? AND temperature IS NOT NULL
            ORDER BY depth ASC
            """,
            (profile_id,),
        ).fetchall()

    if len(rows) < 3:
        return 28.0

    surface_temp = rows[0]["temperature"]
    for row in rows[1:]:
        if surface_temp - row["temperature"] >= 0.5:
            return round(float(row["depth"]), 1)

    return 28.0


def compute_sst(profile_id: int) -> float:
    """Get surface temperature from argo_measurements (shallowest depth <= 20m)."""
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT temperature FROM argo_measurements
            WHERE profile_id = ? AND depth <= 20 AND temperature IS NOT NULL
            ORDER BY depth ASC LIMIT 1
            """,
            (profile_id,),
        ).fetchone()
    return round(float(row["temperature"]), 2) if row else 28.3


def determine_target_species(
    fused_sst: float,
    chlorophyll: float,
    mld: float,
    dist_km: float,
    lat: float
) -> list[str]:
    """Classifies commercial marine species based on multi-variable ecological niches."""
    matched = []

    # 1. Tuna (Yellowfin / Skipjack): Pelagic open ocean and equatorial convergence
    if (dist_km >= 120 or abs(lat) <= 8.0) and 24.0 <= fused_sst <= 29.5:
        matched.append("Tuna / Yellowfin")

    # 2. Surmai (King Mackerel / Seer Fish): Continental shelf break & active thermal fronts
    if dist_km <= 220 and 26.0 <= fused_sst <= 28.8 and mld <= 60:
        matched.append("Surmai / King Mackerel")

    # 3. Bangda (Indian Mackerel): Coastal upwelling & phytoplankton feeding zones
    if dist_km <= 160 and chlorophyll >= 0.38 and 25.0 <= fused_sst <= 29.2:
        matched.append("Bangda / Mackerel")

    # 4. Tarli (Indian Oil Sardine): High-density coastal chlorophyll blooms
    if dist_km <= 130 and chlorophyll >= 0.48 and 25.5 <= fused_sst <= 29.0:
        matched.append("Tarli / Sardine")

    # 5. Paplet (Silver Pomfret): Muddy shelf waters in Konkan, Saurashtra & Bengal
    if dist_km <= 140 and 25.5 <= fused_sst <= 28.8 and (lat >= 14.5 or lat <= -4.0):
        matched.append("Pomfret (Paplet)")

    # 6. Hilsa (Ilish): Northern river mouth plumes (North Bengal & Gulf of Khambhat)
    if lat >= 18.5 and chlorophyll >= 0.50 and 25.0 <= fused_sst <= 30.0:
        matched.append("Hilsa / Ilish")

    # 7. Rawas (Indian Salmon): Coastal river convergence zones
    if dist_km <= 150 and 24.5 <= fused_sst <= 28.2 and lat >= 14.0:
        matched.append("Rawas / Indian Salmon")

    # Fallback to general pelagics if no niche boundary was triggered
    if not matched:
        if dist_km > 150:
            matched = ["Tuna / Yellowfin", "Bangda / Mackerel"]
        else:
            matched = ["Surmai / King Mackerel", "Pomfret (Paplet)"]

    return matched


def score_pfz_fused(
    argo_sst: float,
    mld: float,
    sat_sst: float,
    chlorophyll: float,
    chl_gradient: float
) -> tuple[str, int]:
    """Multi-sensor fused PFZ scoring (0 to 100 points)."""
    fused_sst = (argo_sst + sat_sst) / 2.0

    if fused_sst < 24.0 or fused_sst > 31.0 or chlorophyll < 0.22 or chlorophyll > 5.0:
        return "Sub-optimal", 30

    score = 0

    # 1. SST Score (Max 35)
    if 26.0 <= fused_sst <= 29.5:
        score += 35
    elif 25.0 <= fused_sst <= 30.2:
        score += 28
    else:
        score += 15

    # 2. MLD Score (Max 35)
    if 15 <= mld <= 55:
        score += 35
    elif 10 <= mld <= 75:
        score += 28
    else:
        score += 18

    # 3. Chlorophyll-a Score (Max 22)
    if chlorophyll >= 0.45:
        score += 22
    elif chlorophyll >= 0.26:
        score += 16
    else:
        score += 8

    # 4. Frontal Gradient Bonus (Max 8)
    if chl_gradient >= 0.05:
        score += 8
    else:
        score += 4

    score = min(98, max(30, score))

    if score >= 78:
        rating = "Excellent"
    elif score >= 60:
        rating = "Good"
    elif score >= 50:
        rating = "Fair"
    else:
        rating = "Sub-optimal"

    return rating, score


def get_pfz_advisories(region: str = "all", limit: int | None = None) -> list[dict]:
    """Compute multi-sensor fused PFZ advisories."""
    region_bounds = {
        "arabian_sea": (0.0, 25.0, 55.0, 77.0),
        "bay_of_bengal": (0.0, 25.0, 77.0, 95.0),
        "mumbai": (12.0, 24.0, 62.0, 76.0),
        "kochi": (5.0, 15.0, 68.0, 80.0),
        "chennai": (8.0, 18.0, 77.0, 88.0),
        "vizag": (12.0, 22.0, 78.0, 92.0),
        "all": (-25.0, 30.0, 50.0, 100.0),
    }

    bounds = region_bounds.get(region.lower(), region_bounds["all"])
    lat_min, lat_max, lon_min, lon_max = bounds

    with get_connection() as conn:
        profiles = conn.execute(
            """
            SELECT id, float_id, latitude, longitude, date, max_depth
            FROM argo_profiles
            WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
            GROUP BY float_id
            ORDER BY date DESC
            """,
            (lat_min, lat_max, lon_min, lon_max),
        ).fetchall()

    advisories = []
    for p in profiles:
        prof_id = p["id"]
        f_id = str(p["float_id"])
        lat = round(float(p["latitude"]), 4)
        lon = round(float(p["longitude"]), 4)

        argo_sst = compute_sst(prof_id)
        mld = compute_mld(prof_id)

        sat_data = get_nearest_satellite_data(lat, lon)
        sat_sst = sat_data.get("satellite_sst", argo_sst)
        chlorophyll = sat_data.get("chlorophyll_mg_m3", 0.20)
        chl_gradient = sat_data.get("chlorophyll_gradient", 0.04)

        rating, score = score_pfz_fused(argo_sst, mld, sat_sst, chlorophyll, chl_gradient)

        if score < 60 or rating == "Sub-optimal":
            continue

        fused_sst = round((argo_sst + sat_sst) / 2.0, 2)
        harbour = nearest_harbour(lat, lon)

        fish_species = determine_target_species(
            fused_sst=fused_sst,
            chlorophyll=chlorophyll,
            mld=mld,
            dist_km=harbour["distance_km"],
            lat=lat,
        )

        advisories.append({
            "float_id": f_id,
            "latitude": lat,
            "longitude": lon,
            "date": p["date"],
            "sst_celsius": round(argo_sst, 1),
            "satellite_sst": round(sat_sst, 1),
            "chlorophyll_mg_m3": round(chlorophyll, 2),
            "chlorophyll_gradient": round(chl_gradient, 2),
            "mld_meters": mld,
            "pfz_rating": rating,
            "pfz_score": score,
            "data_confidence": sat_data.get("data_confidence", "High (Fused Multi-Sensor)"),
            "data_sources": sat_data.get("data_sources", ["ARGO In-Situ CTD", "NOAA MUR SST", "NASA VIIRS"]),
            "target_species": fish_species,
            "nearest_harbour": harbour,
            "advisory": (
                f"High-confidence PFZ! Satellite Chlorophyll {chlorophyll:.2f} mg/m³ with optimal "
                f"SST {argo_sst:.1f}°C for {', '.join(fish_species[:2])}. Location: {harbour['distance_km']}km {harbour['compass']} of {harbour['harbour']}."
            ),
        })

    advisories.sort(key=lambda x: x["pfz_score"], reverse=True)

    if limit and limit > 0:
        return advisories[:limit]

    return advisories