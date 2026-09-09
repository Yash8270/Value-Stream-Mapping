def generate_layout(stages, connections, top_nodes):
    """
    Generates initial x,y positions for all VSM nodes.
    
    Top hierarchy (Supplier, Purchasing, Sales, Customer, Production Control, Single Batch):
    - Arrange vertically on the left side
    - Supplier at top-left
    - Purchasing below Supplier
    - Sales to the right of Production Control
    - Customer to the right of Sales
    - Production Control below Purchasing
    - Single Batch below Production Control
    
    Stages:
    - Arrange horizontally below Single Batch
    - Space them evenly across the canvas
    
    Returns dict of node_id -> {x, y}
    """
    positions = {}
    
    # Process top nodes
    top_y = 50
    top_x = 50
    
    supplier_y = top_y
    purchasing_y = supplier_y + 100
    production_control_y = purchasing_y + 100
    single_batch_y = production_control_y + 100
    
    for node in top_nodes:
        ntype = node.get("type", "").lower()
        if ntype == "supplier":
            positions[node["id"]] = {"x": top_x, "y": supplier_y}
        elif ntype == "purchasing":
            positions[node["id"]] = {"x": top_x, "y": purchasing_y}
        elif ntype == "production_control":
            positions[node["id"]] = {"x": top_x, "y": production_control_y}
        elif ntype == "single_batch":
            positions[node["id"]] = {"x": top_x, "y": single_batch_y}
        elif ntype == "sales":
            positions[node["id"]] = {"x": top_x + 200, "y": production_control_y}
        elif ntype == "customer":
            positions[node["id"]] = {"x": top_x + 400, "y": production_control_y}
        else:
            positions[node["id"]] = {"x": top_x, "y": top_y}
            
    # Process stages horizontally
    stage_start_y = single_batch_y + 150
    stage_x = 100
    spacing_x = 250
    
    for i, stage in enumerate(stages):
        stage_id = stage.get("id") if isinstance(stage, dict) else stage.id
        positions[stage_id] = {"x": stage_x + (i * spacing_x), "y": stage_start_y}
        
    return positions
