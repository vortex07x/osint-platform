import asyncio
import whois
import dns.resolver
from datetime import datetime


async def _resolve_dns(domain: str, record_type: str):
    def _lookup():
        try:
            answers = dns.resolver.resolve(domain, record_type, lifetime=5)
            return [str(r).strip('"') for r in answers]
        except Exception:
            return []
    return await asyncio.to_thread(_lookup)


async def _lookup_whois(domain: str):
    def _lookup():
        try:
            return whois.whois(domain)
        except Exception:
            return None
    return await asyncio.to_thread(_lookup)


def _first_or_none(value):
    if isinstance(value, list):
        return value[0] if value else None
    return value


def _classify_mx_provider(mx_records):
    joined = " ".join(mx_records).lower()
    if "google" in joined or "aspmx" in joined:
        return "Google Workspace"
    if "outlook" in joined or "protection.outlook" in joined:
        return "Microsoft 365"
    if "zoho" in joined:
        return "Zoho Mail"
    if "pphosted" in joined or "proofpoint" in joined:
        return "Proofpoint"
    return None


async def check_domain(domain: str) -> dict:
    """
    Runs WHOIS + core DNS record lookups concurrently. Pure data-gathering —
    no DB or Entity logic here, mirrors the separation in breach_checker.py.
    """
    whois_result, a_records, mx_records, ns_records, txt_records = await asyncio.gather(
        _lookup_whois(domain),
        _resolve_dns(domain, "A"),
        _resolve_dns(domain, "MX"),
        _resolve_dns(domain, "NS"),
        _resolve_dns(domain, "TXT"),
    )

    registrar = None
    creation_date = None
    registrant_org = None
    privacy_protected = False

    if whois_result:
        registrar = whois_result.registrar
        creation_date = _first_or_none(whois_result.creation_date)
        if isinstance(creation_date, datetime):
            creation_date = creation_date.isoformat()
        registrant_org = whois_result.org
        whois_text = str(whois_result).lower()
        privacy_protected = any(
            marker in whois_text for marker in ["privacy", "redacted", "whoisguard", "proxy"]
        )
        if privacy_protected:
            registrant_org = None

    spf_record = next((t for t in txt_records if t.lower().startswith("v=spf1")), None)
    mx_provider = _classify_mx_provider(mx_records)

    return {
        "domain": domain,
        "registrar": registrar,
        "creation_date": creation_date,
        "registrant_org": registrant_org,
        "privacy_protected": privacy_protected,
        "a_records": a_records,
        "mx_records": mx_records,
        "mx_provider": mx_provider,
        "ns_records": ns_records,
        "spf_record": spf_record,
        "has_spf": spf_record is not None,
    }


def extract_entities_from_domain_result(result: dict) -> list:
    """
    Mirrors extract_entities_from_github / extract_entities_from_breach_result —
    flattens the raw dict into the entity shape the rest of the pipeline expects.
    """
    entities = []

    if result.get("registrar"):
        entities.append({
            "entity_type": "domain_registrar",
            "value": result["registrar"],
            "confidence_score": 0.9
        })

    if result.get("creation_date"):
        entities.append({
            "entity_type": "domain_creation_date",
            "value": result["creation_date"],
            "confidence_score": 0.9
        })

    if result.get("registrant_org"):
        entities.append({
            "entity_type": "organization",
            "value": result["registrant_org"],
            "confidence_score": 0.75
        })

    if result.get("mx_provider"):
        entities.append({
            "entity_type": "email_provider",
            "value": result["mx_provider"],
            "confidence_score": 0.8
        })

    for ip in result.get("a_records", []):
        entities.append({
            "entity_type": "ip_address",
            "value": ip,
            "confidence_score": 0.85
        })

    entities.append({
        "entity_type": "spf_status",
        "value": "SPF configured" if result.get("has_spf") else "No SPF record found",
        "confidence_score": 0.7
    })

    return entities