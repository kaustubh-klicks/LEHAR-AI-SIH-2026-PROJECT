import json
import os
import requests

FLC_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "flc_centers.json")

# Official INCOIS Master GeoServer WFS Endpoint
INCOIS_FULL_WFS_URL = (
    "https://incois.gov.in/geoserver/wfs"
    "?service=WFS&version=1.0.0&request=GetFeature"
    "&typeName=incois:fish_landing_centers"
    "&maxFeatures=1500"
    "&outputFormat=application/json"
)

def sync_and_get_flcs() -> list[dict]:
    """Fetches all FLC points from INCOIS or reads from local JSON cache."""
    os.makedirs(os.path.dirname(FLC_FILE), exist_ok=True)
    try:
        response = requests.get(INCOIS_FULL_WFS_URL, timeout=6)
        if response.status_code == 200:
            geojson = response.json()
            flc_records = []
            for feat in geojson.get("features", []):
                p = feat.get("properties", {})
                c = feat.get("geometry", {}).get("coordinates", [0, 0])
                if c[0] != 0 and c[1] != 0:
                    flc_records.append({
                        "id": str(p.get("flc_id") or p.get("id") or f"FLC_{len(flc_records)+1}"),
                        "name": str(p.get("flc_name") or p.get("name") or "Fish Landing Centre"),
                        "state": str(p.get("state") or "Coastal India"),
                        "district": str(p.get("district") or ""),
                        "lat": float(c[1]),
                        "lon": float(c[0])
                    })
            if len(flc_records) > 50:
                with open(FLC_FILE, "w", encoding="utf-8") as f:
                    json.dump(flc_records, f, indent=2)
                return flc_records
    except Exception:
        pass

    if os.path.exists(FLC_FILE):
        with open(FLC_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
            
    return []