from sqlalchemy import Column, String, Float, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from db.database import Base

class Entity(Base):
    __tablename__ = "entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"), nullable=True)
    entity_type = Column(String, nullable=False)
    value = Column(String, nullable=False)
    confidence_score = Column(Float, default=1.0)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)