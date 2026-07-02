from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import get_db
from models.entities import Entity
from schemas.entities import EntityCreate, EntityResponse

router = APIRouter(prefix="/entities", tags=["Entities"])

@router.post("/", response_model=EntityResponse)
def create_entity(entity: EntityCreate, db: Session = Depends(get_db)):
    new_entity = Entity(**entity.model_dump())
    db.add(new_entity)
    db.commit()
    db.refresh(new_entity)
    return new_entity

@router.get("/", response_model=List[EntityResponse])
def list_entities(scan_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Entity)
    if scan_id:
        query = query.filter(Entity.scan_id == scan_id)
    return query.all()

@router.get("/{entity_id}", response_model=EntityResponse)
def get_entity(entity_id: str, db: Session = Depends(get_db)):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity