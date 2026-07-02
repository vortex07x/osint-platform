from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import get_db
from models.sources import Source
from schemas.sources import SourceCreate, SourceResponse

router = APIRouter(prefix="/sources", tags=["Sources"])

@router.post("/", response_model=SourceResponse)
def create_source(source: SourceCreate, db: Session = Depends(get_db)):
    new_source = Source(**source.model_dump())
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    return new_source

@router.get("/", response_model=List[SourceResponse])
def list_sources(scan_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Source)
    if scan_id:
        query = query.filter(Source.scan_id == scan_id)
    return query.all()

@router.get("/{source_id}", response_model=SourceResponse)
def get_source(source_id: str, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source