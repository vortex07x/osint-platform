"""
Checks an email address against known data breaches using the free
XposedOrNot API (https://xposedornot.com). No API key required.
Subject to XposedOrNot's free-tier rate limits: 2 req/sec, ~25/hour,
~100/day per IP on the breach-analytics endpoint.
"""

import httpx

BREACH_ANALYTICS_URL = "https://api.xposedornot.com/v1/breach-analytics"


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
    Never raises — network/parse issues degrade to "found": False,
    matching the resilience pattern used by geocoder.py and username_checker.py.
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
                return result  # not found is a normal, expected outcome

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
        pass  # degrade gracefully — never crash the scan

    return result


def extract_entities_from_breach_result(breach_result: dict):
    """
    Converts the normalized breach_result into entity dicts, matching
    the (entity_type, value, confidence_score) shape used elsewhere.
    """
    entities = []

    if not breach_result.get("found"):
        return entities

    password_exposed_in = []

    for b in breach_result["breaches"]:
        label = f"{b['breach']} ({b['xposed_date']})" if b.get("xposed_date") else b["breach"]
        entities.append({
            "entity_type": "data_breach",
            "value": label,
            "confidence_score": 1.0,
        })

        if any("password" in d.lower() for d in b.get("xposed_data", [])):
            password_exposed_in.append(b["breach"])

    if password_exposed_in:
        entities.append({
            "entity_type": "exposed_password",
            "value": f"Password potentially exposed via: {', '.join(password_exposed_in)}",
            "confidence_score": 0.9,
        })

    return entities