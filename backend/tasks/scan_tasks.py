import asyncio
from celery_app import celery_app
from db.database import SessionLocal
from models.scans import Scan
from models.sources import Source
from models.entities import Entity
from models.exposures import Exposure
from scrapers.social.github_scraper import fetch_github_profile, extract_entities_from_github
from ai_engine.risk.risk_engine import analyze_entities


@celery_app.task(name="run_github_scan")
def run_github_scan_task(scan_id: str, username: str):
    """
    Background task version of the GitHub scan.
    Runs independently of the API request/response cycle.
    """
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return {"error": "Scan not found"}

        scan.status = "running"
        db.commit()

        profile_data = asyncio.run(fetch_github_profile(username))

        if profile_data is None:
            scan.status = "failed"
            db.commit()
            return {"error": f"GitHub user '{username}' not found"}

        new_source = Source(
            scan_id=scan_id,
            platform="github",
            url=profile_data.get("html_url"),
            data_type="profile",
            raw_data_json=profile_data
        )
        db.add(new_source)
        db.commit()
        db.refresh(new_source)

        extracted = extract_entities_from_github(profile_data)
        created_entities = []

        for item in extracted:
            new_entity = Entity(
                scan_id=scan_id,
                source_id=new_source.id,
                entity_type=item["entity_type"],
                value=item["value"],
                confidence_score=item["confidence_score"]
            )
            db.add(new_entity)
            created_entities.append(new_entity)

        db.commit()
        for e in created_entities:
            db.refresh(e)

        entity_dicts = [
            {"id": e.id, "entity_type": e.entity_type, "value": e.value}
            for e in created_entities
        ]
        exposure_findings = analyze_entities(entity_dicts)

        for finding in exposure_findings:
            new_exposure = Exposure(
                scan_id=scan_id,
                category=finding["category"],
                severity=finding["severity"],
                title=finding["title"],
                description=finding["description"],
                risk_score=finding["risk_score"],
                affected_entities=finding["affected_entities"],
                recommendations=finding["recommendations"]
            )
            db.add(new_exposure)

        scan.status = "completed"
        scan.progress = 100
        db.commit()

        return {
            "status": "completed",
            "entities_found": len(created_entities),
            "exposures_found": len(exposure_findings)
        }

    except Exception as e:
        scan.status = "failed"
        db.commit()
        return {"error": str(e)}
    finally:
        db.close()