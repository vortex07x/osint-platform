"""
Cross-platform username existence checker.
Checks whether a username exists on various platforms by probing profile URLs.
"""

import httpx
import asyncio

# Platform: URL pattern, and how to detect existence
PLATFORMS = {
    "reddit": {
        "url": "https://www.reddit.com/user/{username}/about.json",
        "headers": {"User-Agent": "OSINT-Platform/1.0"},
        "exists_status": [200]
    },
    "github": {
        "url": "https://api.github.com/users/{username}",
        "headers": {"User-Agent": "OSINT-Platform/1.0"},
        "exists_status": [200]
    },
    "instagram": {
        "url": "https://www.instagram.com/{username}/",
        "headers": {"User-Agent": "Mozilla/5.0"},
        "exists_status": [200]
    },
    "twitter": {
        "url": "https://x.com/{username}",
        "headers": {"User-Agent": "Mozilla/5.0"},
        "exists_status": [200]
    },
    "tiktok": {
        "url": "https://www.tiktok.com/@{username}",
        "headers": {"User-Agent": "Mozilla/5.0"},
        "exists_status": [200]
    },
}


async def check_single_platform(client: httpx.AsyncClient, platform: str, config: dict, username: str):
    url = config["url"].format(username=username)
    try:
        response = await client.get(
            url,
            headers=config["headers"],
            follow_redirects=True,
            timeout=10.0
        )
        exists = response.status_code in config["exists_status"]
        return {
            "platform": platform,
            "url": url,
            "exists": exists,
            "status_code": response.status_code
        }
    except Exception as e:
        return {
            "platform": platform,
            "url": url,
            "exists": False,
            "status_code": None,
            "error": str(e)
        }


async def check_username_across_platforms(username: str):
    """
    Checks the given username across all defined platforms concurrently.
    Returns a list of results (found and not found).
    """
    async with httpx.AsyncClient() as client:
        tasks = [
            check_single_platform(client, platform, config, username)
            for platform, config in PLATFORMS.items()
        ]
        results = await asyncio.gather(*tasks)

    return results