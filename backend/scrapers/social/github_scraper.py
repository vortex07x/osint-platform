import httpx
from datetime import datetime

GITHUB_API_BASE = "https://api.github.com"

async def fetch_github_profile(username: str):
    """
    Fetches public GitHub profile data for a given username.
    Returns raw profile data or None if not found.
    """
    url = f"{GITHUB_API_BASE}/users/{username}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers={"User-Agent": "OSINT-Platform"})

        if response.status_code == 404:
            return None

        response.raise_for_status()
        return response.json()


def extract_entities_from_github(profile_data: dict):
    """
    Given raw GitHub profile JSON, extract meaningful entities.
    Returns a list of dicts: [{entity_type, value, confidence_score}, ...]
    """
    entities = []

    if profile_data.get("email"):
        entities.append({
            "entity_type": "email",
            "value": profile_data["email"],
            "confidence_score": 1.0
        })

    if profile_data.get("name"):
        entities.append({
            "entity_type": "full_name",
            "value": profile_data["name"],
            "confidence_score": 0.9
        })

    if profile_data.get("location"):
        entities.append({
            "entity_type": "location",
            "value": profile_data["location"],
            "confidence_score": 0.8
        })

    if profile_data.get("company"):
        entities.append({
            "entity_type": "organization",
            "value": profile_data["company"],
            "confidence_score": 0.7
        })

    if profile_data.get("blog"):
        entities.append({
            "entity_type": "website",
            "value": profile_data["blog"],
            "confidence_score": 0.85
        })

    if profile_data.get("twitter_username"):
        entities.append({
            "entity_type": "twitter_username",
            "value": profile_data["twitter_username"],
            "confidence_score": 0.9
        })

    return entities