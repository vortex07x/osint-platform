import asyncio
from db.database import SessionLocal
from models.scans import Scan
from models.sources import Source
from models.entities import Entity
from models.exposures import Exposure
from scrapers.social.github_scraper import fetch_github_profile, extract_entities_from_github
from scrapers.social.username_checker import check_username_across_platforms
from ai_engine.risk.risk_engine import analyze_entities
from datetime import datetime, timedelta, timezone
from db.graph_sync import sync_scan_to_graph


def _finalize_task(db, scan_id: str):
    """
    Decrements pending_tasks by 1. When it hits 0, the scan is considered
    fully done (all sub-tasks for this scan have reported in) and gets
    marked completed. Safe to call even for scans that were never given
    a pending_tasks count (defaults to 0, so a single standalone task
    still completes immediately, as before).
    """
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        return
    scan.pending_tasks = max(0, (scan.pending_tasks or 0) - 1)
    if scan.pending_tasks == 0:
        scan.status = "completed"
        scan.progress = 100
    db.commit()


def run_github_scan_task(scan_id: str, username: str):
    """
    Plain function version of the GitHub scan (previously a Celery task).
    Called via FastAPI BackgroundTasks — runs in-process after the response
    is sent, so it needs its own DB session.
    """
    db = SessionLocal()
    scan = None
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return {"error": "Scan not found"}

        if scan.status == "queued":
            scan.status = "running"
            db.commit()

        profile_data = asyncio.run(fetch_github_profile(username))

        if profile_data is None:
            # No GitHub profile for this username — not a hard failure,
            # the cross-platform task may still find results.
            _finalize_task(db, scan_id)
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

        created_exposure_objs = []
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
            created_exposure_objs.append(new_exposure)

        db.commit()
        for ex in created_exposure_objs:
            db.refresh(ex)

        try:
            sync_scan_to_graph(
                scan_id=str(scan.id),
                target_identifier=scan.target_identifier,
                sources=[{"id": new_source.id, "platform": new_source.platform, "url": new_source.url}],
                entities=[
                    {"id": e.id, "entity_type": e.entity_type, "value": e.value, "source_id": e.source_id}
                    for e in created_entities
                ],
                exposures=[
                    {"id": ex.id, "title": ex.title, "severity": ex.severity, "risk_score": ex.risk_score, "affected_entities": ex.affected_entities}
                    for ex in created_exposure_objs
                ]
            )
        except Exception as graph_error:
            print(f"[GRAPH SYNC WARNING] Failed to sync to Neo4j: {graph_error}")

        _finalize_task(db, scan_id)

        return {
            "status": "completed",
            "entities_found": len(created_entities),
            "exposures_found": len(created_exposure_objs)
        }

    except Exception as e:
        if scan:
            _finalize_task(db, scan_id)
        return {"error": str(e)}
    finally:
        db.close()


def run_username_check_task(scan_id: str, username: str):
    """
    Cross-platform username checker, background-task version.
    Mirrors the existing sync `scan-username` endpoint's logic, but
    finalizes via the shared pending_tasks counter instead of directly
    marking the scan completed — since this may be one of two tasks
    running for a combined scan.
    """
    db = SessionLocal()
    scan = None
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return {"error": "Scan not found"}

        if scan.status == "queued":
            scan.status = "running"
            db.commit()

        results = asyncio.run(check_username_across_platforms(username))

        found_platforms = [r for r in results if r.get("exists") and r.get("confidence") == "high"]
        unverified_platforms = [r for r in results if r.get("exists") and r.get("confidence") == "low"]

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

        created_exposure_objs = []
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
            created_exposure_objs.append(new_exposure)

        db.commit()
        for ex in created_exposure_objs:
            db.refresh(ex)

        if created_sources:
            try:
                sync_scan_to_graph(
                    scan_id=str(scan.id),
                    target_identifier=scan.target_identifier,
                    sources=[{"id": s.id, "platform": s.platform, "url": s.url} for s in created_sources],
                    entities=[
                        {"id": e.id, "entity_type": e.entity_type, "value": e.value, "source_id": e.source_id}
                        for e in created_entities
                    ],
                    exposures=[
                        {"id": ex.id, "title": ex.title, "severity": ex.severity, "risk_score": ex.risk_score, "affected_entities": ex.affected_entities}
                        for ex in created_exposure_objs
                    ]
                )
            except Exception as graph_error:
                print(f"[GRAPH SYNC WARNING] Failed to sync to Neo4j: {graph_error}")

        _finalize_task(db, scan_id)

        return {
            "status": "completed",
            "platforms_found_verified": len(found_platforms),
            "platforms_found_unverified": len(unverified_platforms),
            "entities_found": len(created_entities),
            "exposures_found": len(created_exposure_objs)
        }

    except Exception as e:
        if scan:
            _finalize_task(db, scan_id)
        return {"error": str(e)}
    finally:
        db.close()


def check_monitored_scans():
    """
    Called by the GitHub Actions cron hitting /scans/internal/check-monitored-scans.
    Finds all monitored scans that are due for a re-scan, and re-triggers them
    synchronously. Currently only re-runs the GitHub check on schedule — the
    cross-platform check isn't included in monitoring yet.
    """
    db = SessionLocal()
    try:
        monitored_scans = db.query(Scan).filter(Scan.is_monitored == True).all()

        triggered = []
        now = datetime.now(timezone.utc)

        for scan in monitored_scans:
            due = False
            if scan.last_scanned_at is None:
                due = True
            else:
                last_scanned = scan.last_scanned_at
                if last_scanned.tzinfo is None:
                    last_scanned = last_scanned.replace(tzinfo=timezone.utc)

                next_due = last_scanned + timedelta(hours=scan.scan_interval_hours)
                if now >= next_due:
                    due = True

            if due and scan.scan_type == "username":
                scan.last_scanned_at = datetime.now(timezone.utc)
                scan.pending_tasks = 0
                db.commit()
                run_github_scan_task(str(scan.id), scan.target_identifier)
                triggered.append(str(scan.id))

        return {"checked": len(monitored_scans), "triggered": triggered}
    finally:
        db.close()