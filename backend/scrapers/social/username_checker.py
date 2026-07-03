"""
Cross-platform username existence checker.
Uses confidence levels since not all platforms are equally reliable to check
without a full browser (anti-bot measures on Instagram/Twitter/TikTok).
"""

import httpx
import asyncio


async def check_github(client: httpx.AsyncClient, username: str):
    """High confidence: real public API, clean 404 on non-existence."""
    url = f"https://api.github.com/users/{username}"
    try:
        r = await client.get(url, headers={"User-Agent": "OSINT-Platform/1.0"}, timeout=10.0)
        return {
            "platform": "github",
            "url": f"https://github.com/{username}",
            "exists": r.status_code == 200,
            "confidence": "high",
            "status_code": r.status_code
        }
    except Exception as e:
        return {"platform": "github", "url": None, "exists": False, "confidence": "high", "error": str(e)}


async def check_reddit(client: httpx.AsyncClient, username: str):
    """
    Medium-high confidence: JSON API, but we inspect the body
    since Reddit sometimes returns 200 with an error payload instead of 404.
    """
    url = f"https://www.reddit.com/user/{username}/about.json"
    try:
        r = await client.get(url, headers={"User-Agent": "OSINT-Platform/1.0"}, timeout=10.0)
        exists = False
        if r.status_code == 200:
            try:
                data = r.json()
                exists = "data" in data and data["data"].get("name", "").lower() == username.lower()
            except Exception:
                exists = False
        return {
            "platform": "reddit",
            "url": f"https://www.reddit.com/user/{username}",
            "exists": exists,
            "confidence": "high",
            "status_code": r.status_code
        }
    except Exception as e:
        return {"platform": "reddit", "url": None, "exists": False, "confidence": "high", "error": str(e)}


async def check_low_confidence_platform(client: httpx.AsyncClient, platform: str, url_template: str, username: str):
    """
    Low confidence: platforms without a public API. We can only guess based on
    status code + simple text heuristics, which are unreliable against anti-bot pages.
    """
    url = url_template.format(username=username)
    try:
        r = await client.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            follow_redirects=True,
            timeout=10.0
        )
        body = r.text.lower()

        not_found_signals = ["page not found", "user not found", "sorry, this page", "content isn't available"]
        looks_missing = any(signal in body for signal in not_found_signals)

        exists_guess = r.status_code == 200 and not looks_missing

        return {
            "platform": platform,
            "url": url,
            "exists": exists_guess,
            "confidence": "low",
            "status_code": r.status_code
        }
    except Exception as e:
        return {"platform": platform, "url": url, "exists": False, "confidence": "low", "error": str(e)}


LOW_CONFIDENCE_PLATFORMS = {
    "instagram": "https://www.instagram.com/{username}/",
    "twitter": "https://x.com/{username}",
    "tiktok": "https://www.tiktok.com/@{username}",
}


async def check_username_across_platforms(username: str):
    """
    Checks the username across all platforms concurrently.
    Returns a list of results, each tagged with a confidence level.
    """
    async with httpx.AsyncClient() as client:
        tasks = [
            check_github(client, username),
            check_reddit(client, username),
        ]
        tasks += [
            check_low_confidence_platform(client, platform, url_template, username)
            for platform, url_template in LOW_CONFIDENCE_PLATFORMS.items()
        ]
        results = await asyncio.gather(*tasks)

    return results