"""
Checks an email address against known data breaches using the free
XposedOrNot API (https://xposedornot.com). No API key required.
Subject to XposedOrNot's free-tier rate limits: 2 req/sec, ~25/hour,
~100/day per IP on the breach-analytics endpoint.
"""

import httpx

BREACH_ANALYTICS_URL = "https://api.xposedornot.com/v1/breach-analytics"
MAX_INDIVIDUAL_BREACHES = 15


async def check_email_breaches(email: str):
    """
    Returns a normalized dict:
    {
        "found": bool,
        "breaches": [ { breach, domain, xposed_data (list[str]), xposed_date,
                         password_risk, xposed_records, description }, ... ],
        "risk_score": int | None,
        "risk_label": str | None,
    }
    Never raises — network/parse issues degrade to "found": False.
    """
    result = {
        "found": False,
        "breaches": [],
        "risk_score": None,
        "risk_label": None,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                BREACH_ANALYTICS_URL,
                params={"email": email},
                headers={"User-Agent": "OSINT-Platform/1.0"},
                timeout=10.0,
            )

            if response.status_code == 404:
                return result

            response.raise_for_status()
            data = response.json()

        exposed = data.get("ExposedBreaches")
        if not exposed or not exposed.get("breaches_details"):
            return result

        result["found"] = True

        for b in exposed["breaches_details"]:
            xposed_data_raw = b.get("xposed_data", "") or ""
            result["breaches"].append({
                "breach": b.get("breach"),
                "domain": b.get("domain"),
                "xposed_data": [x.strip() for x in xposed_data_raw.split(";") if x.strip()],
                "xposed_date": b.get("xposed_date"),
                "password_risk": b.get("password_risk"),
                "xposed_records": b.get("xposed_records"),
                "description": b.get("details"),
            })

        risk = (data.get("BreachMetrics") or {}).get("risk")
        if risk and isinstance(risk, list) and len(risk) > 0:
            result["risk_score"] = risk[0].get("risk_score")
            result["risk_label"] = risk[0].get("risk_label")

    except Exception:
        pass

    return result


def _parse_year(breach: dict) -> int:
    try:
        return int(breach.get("xposed_date") or 0)
    except (TypeError, ValueError):
        return 0


def extract_entities_from_breach_result(breach_result: dict, max_individual: int = MAX_INDIVIDUAL_BREACHES):
    """
    Converts the normalized breach_result into entity dicts. Only the
    most recent `max_individual` breaches get their own entity +
    exposure card; anything beyond that is rolled into a single
    summary entity instead of flooding the report with dozens of
    near-identical cards.

    Returns (entities, shown_breaches). shown_breaches is the capped,
    sorted list the caller should create Source rows for — avoids
    creating a database row per breach when there are hundreds.
    """
    entities = []

    if not breach_result.get("found"):
        return entities, []

    all_breaches = sorted(breach_result["breaches"], key=_parse_year, reverse=True)
    shown_breaches = all_breaches[:max_individual]
    remaining_breaches = all_breaches[max_individual:]

    for b in shown_breaches:
        label = f"{b['breach']} ({b['xposed_date']})" if b.get("xposed_date") else b["breach"]
        entities.append({
            "entity_type": "data_breach",
            "value": label,
            "confidence_score": 1.0,
        })

    if remaining_breaches:
        names_preview = ", ".join(b["breach"] for b in remaining_breaches[:10])
        more_suffix = f", and {len(remaining_breaches) - 10} more" if len(remaining_breaches) > 10 else ""
        entities.append({
            "entity_type": "additional_breaches",
            "value": f"{len(remaining_breaches)} additional breach(es): {names_preview}{more_suffix}",
            "confidence_score": 1.0,
            "metadata_json": {"breaches": [b["breach"] for b in remaining_breaches]},
        })

    password_exposed_in = [
        b["breach"] for b in all_breaches
        if any("password" in d.lower() for d in b.get("xposed_data", []))
    ]

    if password_exposed_in:
        preview = ", ".join(password_exposed_in[:5])
        more_suffix = f", and {len(password_exposed_in) - 5} more" if len(password_exposed_in) > 5 else ""
        entities.append({
            "entity_type": "exposed_password",
            "value": f"Password potentially exposed in {len(password_exposed_in)} breach(es), including {preview}{more_suffix}",
            "confidence_score": 0.9,
            "metadata_json": {"breaches": password_exposed_in},
        })

    return entities, shown_breaches