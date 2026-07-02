from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class EntityCreate(BaseModel):
    scan_id: UUID
    source_id: Optional[UUID] = None
    entity_type: str
    value: str
    confidence_score: Optional[float] = 1.0
    metadata_json: Optional[Dict[str, Any]] = None

class EntityResponse(BaseModel):
    id: UUID
    scan_id: UUID
    source_id: Optional[UUID] = None
    entity_type: str
    value: str
    confidence_score: float
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True