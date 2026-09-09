from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProcessMetrics(BaseModel):
    ct: float = 0
    mt: float = 0
    ut: float = 0
    st: float = 0
    op: int = 1
    scrap: float = 0
    rft: float = 1.0
    inventory_after: Optional[float] = None

class VSMProcess(BaseModel):
    id: str
    sequence: int = 1
    name: str
    metrics: ProcessMetrics

class VSMStage(BaseModel):
    id: str
    name: str
    starting_inventory: Optional[float] = None
    inventory: Optional[float] = None
    processes: List[VSMProcess] = Field(default_factory=list)

class VSMNode(BaseModel):
    id: str
    type: str
    label: str
    position: Dict[str, float]
    data: Dict[str, Any]
    stage_id: Optional[str] = None

class VSMConnection(BaseModel):
    id: str
    source: str
    target: str
    direction: str = 'forward'
    label: Optional[str] = None

class VSMModel(BaseModel):
    id: str
    project: Dict[str, str]
    nodes: List[VSMNode] = Field(default_factory=list)
    connections: List[VSMConnection] = Field(default_factory=list)
    stages: List[VSMStage] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class VSMCreateRequest(BaseModel):
    project: Dict[str, str]
    stages: List[VSMStage]
    connections: Optional[List[VSMConnection]] = []

class VSMUpdateRequest(BaseModel):
    nodes: Optional[List[VSMNode]] = None
    connections: Optional[List[VSMConnection]] = None
    stages: Optional[List[VSMStage]] = None
    metadata: Optional[Dict[str, Any]] = None

class ImportErrorDetail(BaseModel):
    code: str = "INSUFFICIENT_VSM_DATA"
    message: str = "Not enough data provided to generate the VSM."
    missing: List[str] = Field(default_factory=list)
    present: List[str] = Field(default_factory=list)

class ImportResult(BaseModel):
    success: bool
    vsm: Optional[VSMModel] = None
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    error: Optional[ImportErrorDetail] = None
    stats: Dict[str, Any] = Field(default_factory=dict)
