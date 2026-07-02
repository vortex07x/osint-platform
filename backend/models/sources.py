from sqlalchemy import Column, String, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from db.database import Base

class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id"), nullable=False)
    platform = Column(String, nullable=False)
    url = Column(String, nullable=True)
    data_type = Column(String, nullable=True)
    raw_data_json = Column(JSON, nullable=True)
    collected_at = Column(TIMESTAMP, default=datetime.utcnow)