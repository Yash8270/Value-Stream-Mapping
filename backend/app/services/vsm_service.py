import uuid
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.vsm import VSMProject
from app.schemas.vsm import VSMModel, VSMUpdateRequest
from app.vsm.layout import generate_layout

class VSMService:
    def generate_from_stages(self, stages, connections, project) -> VSMModel:
        """Generate complete VSM model from stages + connections"""
        top_nodes = [
            {"id": "supplier", "type": "supplier", "label": "Supplier", "position": {"x":0,"y":0}, "data": {}},
            {"id": "purchasing", "type": "purchasing", "label": "Purchasing", "position": {"x":0,"y":0}, "data": {}},
            {"id": "sales", "type": "sales", "label": "Sales", "position": {"x":0,"y":0}, "data": {}},
            {"id": "customer", "type": "customer", "label": "Customer", "position": {"x":0,"y":0}, "data": {}},
            {"id": "production_control", "type": "production_control", "label": "Production Control", "position": {"x":0,"y":0}, "data": {}},
            {"id": "single_batch", "type": "single_batch", "label": "Single Batch", "position": {"x":0,"y":0}, "data": {}}
        ]
        
        positions = generate_layout(stages, connections, top_nodes)
        
        for node in top_nodes:
            if node["id"] in positions:
                node["position"] = positions[node["id"]]
                
        stage_nodes = []
        for stage in stages:
            stage_nodes.append({
                "id": stage.id,
                "type": "stage",
                "label": stage.name,
                "position": positions.get(stage.id, {"x":0,"y":0}),
                "data": {},
                "stage_id": stage.id
            })
            
        nodes = top_nodes + stage_nodes
        
        return VSMModel(
            id=str(uuid.uuid4()),
            project=project,
            nodes=nodes,
            connections=connections,
            stages=stages,
            metadata={}
        )
    
    def get_vsm(self, db: Session, vsm_id: str) -> Optional[VSMModel]:
        """Load from database"""
        db_project = db.query(VSMProject).filter(VSMProject.id == vsm_id).first()
        if db_project and db_project.current_model:
            data = db_project.current_model
            if isinstance(data, str):
                data = json.loads(data)
            return VSMModel(**data)
        return None
