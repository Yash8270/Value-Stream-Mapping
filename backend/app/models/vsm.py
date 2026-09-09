import uuid
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class VSMProject(Base):
    __tablename__ = "vsm_projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(Enum('MANUAL', 'EXCEL', 'JSON', name='source_type_enum'), nullable=False, default='MANUAL')
    current_model = Column(JSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False, index=True)

    user = relationship("User", back_populates="projects")
    imported_files = relationship("ImportedData", back_populates="project", cascade="all, delete-orphan")
