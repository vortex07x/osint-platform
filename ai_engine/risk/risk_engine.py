"""
Risk Scoring Engine
Analyzes extracted entities and generates exposure findings with severity/risk scores.
"""

# Defines how risky each entity type is by default
ENTITY_RISK_PROFILES = {
    "email": {
        "category": "contact",
        "severity": "medium",
        "base_score": 40,
        "title": "Public email address found",
        "recommendation": "Consider using a separate email for public profiles to reduce spam/phishing risk."
    },
    "phone": {
        "category": "contact",
        "severity": "high",
        "base_score": 65,
        "title": "Public phone number found",
        "recommendation": "Remove phone number from public profiles where possible."
    },
    "full_name": {
        "category": "personal",
        "severity": "low",
        "base_score": 15,
        "title": "Full name publicly associated with account",
        "recommendation": "This is often unavoidable, but be aware it links your identity to this account."
    },
    "location": {
        "category": "personal",
        "severity": "medium",
        "base_score": 35,
        "title": "Location information exposed",
        "recommendation": "Consider using a general region instead of a specific city if privacy is a concern."
    },
    "organization": {
        "category": "social",
        "severity": "low",
        "base_score": 20,
        "title": "Employer/organization publicly visible",
        "recommendation": "This can be used for social engineering; be cautious of unsolicited work-related contact."
    },
    "website": {
        "category": "social",
        "severity": "low",
        "base_score": 10,
        "title": "Personal website/blog linked",
        "recommendation": "Ensure the linked site doesn't expose additional sensitive information."
    },
    "twitter_username": {
        "category": "social",
        "severity": "low",
        "base_score": 15,
        "title": "Linked social media account found",
        "recommendation": "Cross-platform linking increases correlation risk across your accounts."
    },
    "username": {
        "category": "social",
        "severity": "low",
        "base_score": 10,
        "title": "Username reused across platforms",
        "recommendation": "Reusing usernames makes it easier to correlate your activity across platforms."
    },
    "gps_location": {
        "category": "personal",
        "severity": "high",
        "base_score": 70,
        "title": "Precise GPS location embedded in image",
        "recommendation": "Strip EXIF metadata before sharing photos publicly, or disable location tagging in your camera/phone settings."
    },
    "device": {
        "category": "behavioral",
        "severity": "low",
        "base_score": 15,
        "title": "Device/camera model identifiable from image metadata",
        "recommendation": "Generally low risk, but can contribute to device fingerprinting across multiple photos."
    },
    "photo_timestamp": {
        "category": "behavioral",
        "severity": "low",
        "base_score": 10,
        "title": "Exact photo capture timestamp exposed",
        "recommendation": "Can reveal patterns in your routine when combined with other photos."
    },
    "editing_software": {
        "category": "behavioral",
        "severity": "low",
        "base_score": 5,
        "title": "Photo editing software identified",
        "recommendation": "Minimal risk on its own."
    },
    "data_breach": {
        "category": "security",
        "severity": "high",
        "base_score": 55,
        "title": "Email found in known data breach",
        "recommendation": "Change your password on this platform and anywhere else you reused it, and enable two-factor authentication if available."
    },
    "exposed_password": {
        "category": "security",
        "severity": "critical",
        "base_score": 80,
        "title": "Password potentially exposed in a data breach",
        "recommendation": "Change this password immediately everywhere it was reused, and consider using a password manager to generate unique passwords per site."
    },
}

DEFAULT_RISK_PROFILE = {
    "category": "behavioral",
    "severity": "low",
    "base_score": 10,
    "title": "Miscellaneous data point found",
    "recommendation": "Review this finding for potential privacy impact."
}


def analyze_entities(entities: list) -> list:
    """
    Takes a list of entity dicts (with entity_type, value, id) and returns
    a list of exposure dicts ready to be stored.
    """
    exposures = []

    # Count entity types to detect cross-platform correlation risk
    entity_type_counts = {}
    for e in entities:
        entity_type_counts[e["entity_type"]] = entity_type_counts.get(e["entity_type"], 0) + 1

    for entity in entities:
        profile = ENTITY_RISK_PROFILES.get(entity["entity_type"], DEFAULT_RISK_PROFILE)

        risk_score = profile["base_score"]

        exposures.append({
            "category": profile["category"],
            "severity": profile["severity"],
            "title": profile["title"],
            "description": f"Found value: '{entity['value']}' (entity type: {entity['entity_type']})",
            "risk_score": risk_score,
            "affected_entities": [str(entity["id"])],
            "recommendations": profile["recommendation"]
        })

    # Bonus exposure: if multiple entity types were found, correlation risk increases
    if len(entities) >= 3:
        exposures.append({
            "category": "behavioral",
            "severity": "medium",
            "title": "Multiple data points correlate to a single identity",
            "description": f"{len(entities)} distinct data points were found and linked together, increasing re-identification risk.",
            "risk_score": 30 + (len(entities) * 2),
            "affected_entities": [str(e["id"]) for e in entities],
            "recommendations": "Consider separating your public identities across platforms to reduce correlation risk."
        })

    return exposures