def calculate_timeline(stages):
    """
    For each stage, calculate timeline segments.
    Each segment has:
      - process_name
      - ct (cycle time)
      - mt (machine/wait time)
      - is_wait_highlighted: bool (mt > 0)
    
    IMPORTANT: Do NOT use ct as physical width.
    Return normalized segment data.
    The frontend will render with equal visual widths.
    """
    timeline_data = []
    
    for stage in stages:
        processes = stage.get("processes", []) if isinstance(stage, dict) else stage.processes
        stage_segments = []
        for p in processes:
            metrics = p.get("metrics", {}) if isinstance(p, dict) else p.metrics.to_dict()
            ct = float(metrics.get("ct", 0))
            mt = float(metrics.get("mt", 0))
            name = p.get("name", "") if isinstance(p, dict) else p.name
            
            stage_segments.append({
                "process_name": name,
                "ct": ct,
                "mt": mt,
                "is_wait_highlighted": mt > 0
            })
            
        timeline_data.append({
            "stage_id": stage.get("id") if isinstance(stage, dict) else stage.id,
            "segments": stage_segments
        })
        
    return timeline_data
