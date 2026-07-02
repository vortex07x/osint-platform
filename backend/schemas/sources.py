from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class SourceCreate(BaseModel):
    scan_id: UUID
    platform: str
    url: Optional[str] = None
    data_type: Optional[str] = None
    raw_data_json: Optional[Dict[str, Any]] = None

class SourceResponse(BaseModel):
    id: UUID
    scan_id: UUID
    platform: str
    url: Optional[str] = None
    data_type: Optional[str] = None
    raw_data_json: Optional[Dict[str, Any]] = None
    collected_at: datetime

    class Config:
        from_attributes = True