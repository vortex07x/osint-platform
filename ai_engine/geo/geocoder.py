"""
Geocodes free-text location strings (e.g., "San Francisco") into
lat/lon coordinates using OpenStreetMap's free Nominatim API.
"""

import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


async def geocode_location(location_text: str):
    """
    Takes a free-text location string and returns {"lat": float, "lon": float}
    or None if it can't be resolved.
    """
    if not location_text or not location_text.strip():
        return None

    params = {
        "q": location_text,
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "OSINT-Platform/1.0 (educational project)"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(NOMINATIM_URL, params=params, headers=headers, timeout=10.0)
            response.raise_for_status()
            results = response.json()

            if not results:
                return None

            return {
                "lat": float(results[0]["lat"]),
                "lon": float(results[0]["lon"])
            }
    except Exception:
        return None