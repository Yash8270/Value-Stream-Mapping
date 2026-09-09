def process_inventory(stages):
    """
    Handles inventory data for all stages.
    
    CRITICAL RULES:
    - Inventory values come from stage.inventory or process.inventory_after
    - NEVER calculate inventory from RFT
    - NEVER reset all stages to the same value
    - If inventory is missing, return None (not 0)
    """
    inventory_data = {}
    
    for stage in stages:
        stage_id = stage.get("id") if isinstance(stage, dict) else stage.id
        inv = stage.get("inventory") if isinstance(stage, dict) else stage.inventory
        
        if inv is not None:
            inventory_data[stage_id] = float(inv)
        else:
            # check processes
            processes = stage.get("processes", []) if isinstance(stage, dict) else stage.processes
            found = False
            for p in reversed(processes):
                metrics = p.get("metrics", {}) if isinstance(p, dict) else p.metrics.to_dict()
                p_inv = metrics.get("inventory_after")
                if p_inv is not None:
                    inventory_data[stage_id] = float(p_inv)
                    found = True
                    break
            if not found:
                inventory_data[stage_id] = None
                
    return inventory_data
