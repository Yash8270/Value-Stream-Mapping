import uuid
from typing import List, Dict, Any, Optional

class ProcessMetrics:
    def __init__(self, ct=0, mt=0, ut=0, st=0, op=1, scrap=0, rft=1.0, inventory_after=None):
        self.ct = float(ct)
        self.mt = float(mt)
        self.ut = float(ut)
        self.st = float(st)
        self.op = int(op)
        self.scrap = float(scrap)
        self.rft = float(rft)
        self.inventory_after = float(inventory_after) if inventory_after is not None else None
    
    def to_dict(self):
        return {
            "ct": self.ct, "mt": self.mt, "ut": self.ut, "st": self.st,
            "op": self.op, "scrap": self.scrap, "rft": self.rft, "inventory_after": self.inventory_after
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(**data)

class VSMProcess:
    def __init__(self, id, name, metrics):
        self.id = id
        self.name = name
        self.metrics = ProcessMetrics.from_dict(metrics) if isinstance(metrics, dict) else metrics
    
    def to_dict(self):
        return {"id": self.id, "name": self.name, "metrics": self.metrics.to_dict()}
    
    @classmethod
    def from_dict(cls, data):
        return cls(data["id"], data["name"], data["metrics"])

class VSMStage:
    def __init__(self, id, name, processes, inventory=None):
        self.id = id
        self.name = name
        self.processes = [VSMProcess.from_dict(p) if isinstance(p, dict) else p for p in processes]
        self.inventory = float(inventory) if inventory is not None else None
        
    def to_dict(self):
        return {"id": self.id, "name": self.name, "inventory": self.inventory, "processes": [p.to_dict() for p in self.processes]}
    
    @classmethod
    def from_dict(cls, data):
        return cls(data["id"], data["name"], data["processes"], data.get("inventory"))

class VSMNode:
    def __init__(self, id, type, label, position, data, stage_id=None):
        self.id = id
        self.type = type
        self.label = label
        self.position = position
        self.data = data
        self.stage_id = stage_id
        
    def to_dict(self):
        return {"id": self.id, "type": self.type, "label": self.label, "position": self.position, "data": self.data, "stage_id": self.stage_id}
    
    @classmethod
    def from_dict(cls, data):
        return cls(data["id"], data["type"], data["label"], data["position"], data["data"], data.get("stage_id"))

class VSMConnection:
    def __init__(self, id, source, target, direction='forward', label=None):
        self.id = id
        self.source = source
        self.target = target
        self.direction = direction
        self.label = label
        
    def to_dict(self):
        return {"id": self.id, "source": self.source, "target": self.target, "direction": self.direction, "label": self.label}
    
    @classmethod
    def from_dict(cls, data):
        return cls(data["id"], data["source"], data["target"], data.get("direction", "forward"), data.get("label"))

class VSMModelDomain:
    def __init__(self, id, project, nodes, connections, stages, metadata=None):
        self.id = id or str(uuid.uuid4())
        self.project = project
        self.nodes = [VSMNode.from_dict(n) if isinstance(n, dict) else n for n in nodes]
        self.connections = [VSMConnection.from_dict(c) if isinstance(c, dict) else c for c in connections]
        self.stages = [VSMStage.from_dict(s) if isinstance(s, dict) else s for s in stages]
        self.metadata = metadata or {}
        
    def to_dict(self):
        return {
            "id": self.id,
            "project": self.project,
            "nodes": [n.to_dict() for n in self.nodes],
            "connections": [c.to_dict() for c in self.connections],
            "stages": [s.to_dict() for s in self.stages],
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            data.get("id"), data["project"], data["nodes"], data["connections"], data["stages"], data.get("metadata")
        )
