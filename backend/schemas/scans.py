from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from schemas.sources import SourceResponse
from schemas.entities import EntityResponse
from schemas.exposures import ExposureResponse
from typing import List

class ScanCreate(BaseModel):
    target_identifier: str
    scan_type: str
    config_json: Optional[Dict[str, Any]] = None

class ScanResponse(BaseModel):
    id: UUID
    target_identifier: str
    scan_type: str
    status: str
    progress: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScanFullReport(ScanResponse):
    sources: List[SourceResponse] = []
    entities: List[EntityResponse] = []
    exposures: List[ExposureResponse] = []