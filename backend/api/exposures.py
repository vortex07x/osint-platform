from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import get_db
from models.exposures import Exposure
from schemas.exposures import ExposureCreate, ExposureResponse

router = APIRouter(prefix="/exposures", tags=["Exposures"])

@router.post("/", response_model=ExposureResponse)
def create_exposure(exposure: ExposureCreate, db: Session = Depends(get_db)):
    new_exposure = Exposure(**exposure.model_dump())
    db.add(new_exposure)
    db.commit()
    db.refresh(new_exposure)
    return new_exposure

@router.get("/", response_model=List[ExposureResponse])
def list_exposures(scan_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Exposure)
    if scan_id:
        query = query.filter(Exposure.scan_id == scan_id)
    return query.all()

@router.get("/{exposure_id}", response_model=ExposureResponse)
def get_exposure(exposure_id: str, db: Session = Depends(get_db)):
    exposure = db.query(Exposure).filter(Exposure.id == exposure_id).first()
    if not exposure:
        raise HTTPException(status_code=404, detail="Exposure not found")
    return exposure