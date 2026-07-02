from sqlalchemy import Column, String, Integer, TIMESTAMP, JSON, ForeignKey
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