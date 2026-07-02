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