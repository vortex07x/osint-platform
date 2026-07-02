from sqlalchemy import Column, String, Integer, TIMESTAMP, JSON, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from db.database import Base

class Exposure(Base):
    __tablename__ = "exposures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id"), nullable=False)
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    risk_score = Column(Integer, default=0)
    affected_entities = Column(JSON, nullable=True)
    recommendations = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)