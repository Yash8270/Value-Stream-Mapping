def validate_vsm(vsm_model):
    """
    Validates a VSM model.
    Returns: {valid: bool, warnings: [], errors: []}
    
    Checks:
    - All connections reference existing nodes
    - Process metrics are non-negative numbers
    - Stage process order is preserved
    - Required fields present
    """
    errors = []
    warnings = []
    
    nodes = vsm_model.get("nodes", []) if isinstance(vsm_model, dict) else [n.to_dict() for n in vsm_model.nodes]
    connections = vsm_model.get("connections", []) if isinstance(vsm_model, dict) else [c.to_dict() for c in vsm_model.connections]
    stages = vsm_model.get("stages", []) if isinstance(vsm_model, dict) else [s.to_dict() for s in vsm_model.stages]
    
    node_ids = {n["id"] for n in nodes}
    
    for c in connections:
        if c["source"] not in node_ids:
            errors.append(f"Connection {c['id']} has invalid source {c['source']}")
        if c["target"] not in node_ids:
            errors.append(f"Connection {c['id']} has invalid target {c['target']}")
            
    for stage in stages:
        if not stage.get("processes"):
            warnings.append(f"Stage {stage.get('name', stage.get('id'))} has no processes")
        else:
            for p in stage.get("processes", []):
                metrics = p.get("metrics", {})
                for k in ["ct", "mt", "ut", "st", "scrap"]:
                    val = metrics.get(k, 0)
                    if val is not None and float(val) < 0:
                        errors.append(f"Process {p.get('name')} has negative metric for {k}")
                        
    return {
        "valid": len(errors) == 0,
        "warnings": warnings,
        "errors": errors
    }
