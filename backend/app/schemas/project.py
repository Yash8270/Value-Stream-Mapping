from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: Optional[str] = "MANUAL"
    initial_model: Optional[Dict[str, Any]] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    current_model: Optional[Dict[str, Any]] = None

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    source_type: str
    current_model: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectListItem(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    source_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
