from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

class ExposureCreate(BaseModel):
    scan_id: UUID
    category: str
    severity: str
    title: str
    description: Optional[str] = None
    risk_score: Optional[int] = 0
    affected_entities: Optional[List[Any]] = None
    recommendations: Optional[str] = None

class ExposureResponse(BaseModel):
    id: UUID
    scan_id: UUID
    category: str
    severity: str
    title: str
    description: Optional[str] = None
    risk_score: int
    affected_entities: Optional[List[Any]] = None
    recommendations: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True