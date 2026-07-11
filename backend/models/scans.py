from sqlalchemy import Column, String, Integer, TIMESTAMP, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from db.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    target_identifier = Column(String, nullable=False)
    scan_type = Column(String, nullable=False)
    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    config_json = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    completed_at = Column(TIMESTAMP, nullable=True)
    is_monitored = Column(Boolean, default=False)
    scan_interval_hours = Column(Integer, default=24)
    last_scanned_at = Column(TIMESTAMP, nullable=True)
    pending_tasks = Column(Integer, default=0)