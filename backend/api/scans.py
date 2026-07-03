from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from models.scans import Scan
from schemas.scans import ScanCreate, ScanResponse
from models.sources import Source
from models.entities import Entity
from models.exposures import Exposure
from schemas.scans import ScanFullReport
from scrapers.social.github_scraper import fetch_github_profile, extract_entities_from_github
from models.sources import Source
from models.entities import Entity
from ai_engine.risk.risk_engine import analyze_entities
# from models.exposures import Exposure
from scrapers.social.username_checker import check_username_across_platforms
from tasks.scan_tasks import run_github_scan_task
from schemas.scans import MonitoringUpdate

router = APIRouter(prefix="/scans", tags=["Scans"])

@router.post("/", response_model=ScanResponse)
def create_scan(scan: ScanCreate, db: Session = Depends(get_db)):
    new_scan = Scan(
        target_identifier=scan.target_identifier,
        scan_type=scan.scan_type,
        config_json=scan.config_json
    )
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)
    return new_scan

@router.get("/", response_model=List[ScanResponse])
def list_scans(db: Session = Depends(get_db)):
    return db.query(Scan).all()

@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.get("/{scan_id}/full-report", response_model=ScanFullReport)
def get_full_report(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    sources = db.query(Source).filter(Source.scan_id == scan_id).all()
    entities = db.query(Entity).filter(Entity.scan_id == scan_id).all()
    exposures = db.query(Exposure).filter(Exposure.scan_id == scan_id).all()

    return ScanFullReport(
        **scan.__dict__,
        sources=sources,
        entities=entities,
        exposures=exposures
    )

@router.post("/{scan_id}/scan-github/{username}")
async def scan_github_profile(scan_id: str, username: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    profile_data = await fetch_github_profile(username)

    if profile_data is None:
        raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found")

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

    created_exposures = []
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
        created_exposures.append(new_exposure)

    scan.status = "completed"
    scan.progress = 100
    db.commit()

    return {
        "message": f"GitHub scan completed for '{username}'",
        "source_id": str(new_source.id),
        "entities_found": len(created_entities),
        "exposures_found": len(created_exposures),
        "entities": [
            {"entity_type": e.entity_type, "value": e.value}
            for e in created_entities
        ],
        "exposures": [
            {"title": exp.title, "severity": exp.severity, "risk_score": exp.risk_score}
            for exp in created_exposures
        ]
    }

@router.post("/{scan_id}/scan-username/{username}")
async def scan_username_cross_platform(scan_id: str, username: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    results = await check_username_across_platforms(username)

    found_platforms = [r for r in results if r["exists"] and r["confidence"] == "high"]
    unverified_platforms = [r for r in results if r["exists"] and r["confidence"] == "low"]

    created_sources = []
    created_entities = []

    for platform_result in found_platforms:
        new_source = Source(
            scan_id=scan_id,
            platform=platform_result["platform"],
            url=platform_result["url"],
            data_type="profile_existence",
            raw_data_json=platform_result
        )
        db.add(new_source)
        db.commit()
        db.refresh(new_source)
        created_sources.append(new_source)

        new_entity = Entity(
            scan_id=scan_id,
            source_id=new_source.id,
            entity_type="username",
            value=f"{username} (on {platform_result['platform']})",
            confidence_score=0.85
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

    created_exposures = []
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
        created_exposures.append(new_exposure)

    scan.status = "completed"
    scan.progress = 100
    db.commit()

    return {
        "message": f"Username scan completed for '{username}'",
        "platforms_checked": len(results),
        "platforms_found_verified": len(found_platforms),
        "found_on_verified": [p["platform"] for p in found_platforms],
        "platforms_found_unverified": len(unverified_platforms),
        "found_on_unverified": [p["platform"] for p in unverified_platforms],
        "entities_found": len(created_entities),
        "exposures_found": len(created_exposures),
        "exposures": [
            {"title": exp.title, "severity": exp.severity, "risk_score": exp.risk_score}
            for exp in created_exposures
        ]
    }

@router.post("/{scan_id}/scan-github-async/{username}")
def scan_github_async(scan_id: str, username: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan.status = "queued"
    db.commit()

    task = run_github_scan_task.delay(scan_id, username)

    return {
        "message": "Scan queued for background processing",
        "task_id": task.id,
        "scan_id": scan_id
    }

@router.patch("/{scan_id}/monitoring", response_model=ScanResponse)
def update_monitoring(scan_id: str, update: MonitoringUpdate, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan.is_monitored = update.is_monitored
    scan.scan_interval_hours = update.scan_interval_hours
    db.commit()
    db.refresh(scan)
    return scan