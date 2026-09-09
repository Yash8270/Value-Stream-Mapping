import uuid
from sqlalchemy import Column, String, Text, BigInteger, DateTime, Enum, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class ImportedData(Base):
    __tablename__ = "imported_data"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("vsm_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(Enum('EXCEL', 'JSON', name='file_type_enum'), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    storage_key = Column(String(1000), nullable=True)
    parsed_data = Column(JSON, nullable=True)
    import_status = Column(Enum('UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED', name='import_status_enum'), nullable=False, default='UPLOADING')
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    user = relationship("User")
    project = relationship("VSMProject", back_populates="imported_files")
