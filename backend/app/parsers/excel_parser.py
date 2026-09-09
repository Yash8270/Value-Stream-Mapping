import io
import re
import uuid
import openpyxl
import pandas as pd
from typing import Dict, Any, List, Optional
from app.schemas.vsm import (
    ImportResult, ImportErrorDetail, VSMModel, VSMStage, 
    VSMProcess, ProcessMetrics, VSMNode, VSMConnection
)

ALIAS_MAP = {
    'fibre prep fiber': 'Fibre Prep',
    'fibre prep': 'Fibre Prep',
    'fibre prep fiber ': 'Fibre Prep',
    'cell build': 'Cell Build',
    'package assembly': 'Package Assembly',
    'ca': 'Collimator Assembly',
    'collimator assembly': 'Collimator Assembly',
    'ctia': 'CTIA',
}

def slugify(s):
    res = re.sub(r'[^a-z0-9]+', '_', str(s).lower()).strip('_')
    return res if res else f"stage_{uuid.uuid4().hex[:6]}"

class ExcelVSMParser:
    def parse(self, file_bytes: bytes) -> ImportResult:
        try:
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True, read_only=True)
            
            data_sheet_name = None
            for name in wb.sheetnames:
                if name.lower() in ['data', 'vsm', 'processes']:
                    data_sheet_name = name
                    break
            if not data_sheet_name:
                data_sheet_name = wb.sheetnames[0]

            ws = wb[data_sheet_name]
            
            stages_dict = {}
            current_stage = None
            
            # Flags to track explicit VSM content in source file
            has_explicit_process_data = False
            has_explicit_process_flow = False
            has_explicit_inventory = False
            has_explicit_vsm_structure = False

            def safe_float(v):
                try:
                    if v is None: return None
                    f = float(v)
                    return f if not pd.isna(f) else None
                except Exception:
                    return None

            def safe_int(v):
                try:
                    if v is None: return None
                    return int(float(v))
                except Exception:
                    return None

            # 1. Scan header rows & columns for explicit keywords
            flow_keywords = ['seq', 'sequence', 'next', 'next_process', 'predecessor', 'successor', 'connection', 'flow', 'from', 'to', 'step']
            inventory_keywords = ['inventory', 'wip', 'stock', 'starting_inventory', 'inv', 'qty', 'quantity']

            for row in ws.iter_rows(min_row=1, max_row=5, values_only=True):
                if row:
                    for cell in row:
                        if cell is not None:
                            val_str = str(cell).strip().lower()
                            if any(k in val_str for k in flow_keywords):
                                has_explicit_process_flow = True
                            if any(k in val_str for k in inventory_keywords):
                                has_explicit_inventory = True

            # 2. Iterate through all rows in worksheet
            for row in ws.iter_rows(min_row=1, max_col=14, values_only=True):
                if not row or len(row) < 2:
                    continue
                
                # Check Column A for Stage / Subassembly Name
                col_a = row[0]
                if col_a is not None and str(col_a).strip() and str(col_a).strip().lower() not in ['stage', 'subassembly', 'area', 'group', 'nan']:
                    raw_stage_key = ' '.join(str(col_a).strip().lower().split())
                    mapped_stage_name = ALIAS_MAP.get(raw_stage_key, str(col_a).strip())
                    current_stage = mapped_stage_name
                    has_explicit_vsm_structure = True

                    if current_stage not in stages_dict:
                        stage_id = slugify(current_stage)
                        stages_dict[current_stage] = {
                            "id": stage_id,
                            "name": current_stage,
                            "starting_inventory": None, # NO hardcoded default!
                            "inventory": None,
                            "processes": []
                        }

                    # Scan remaining cells in this stage header row for explicit stage inventory numbers
                    for cell_val in row[1:]:
                        val_flt = safe_float(cell_val)
                        if val_flt is not None and val_flt >= 0:
                            if stages_dict[current_stage]["starting_inventory"] is None:
                                stages_dict[current_stage]["starting_inventory"] = val_flt
                                stages_dict[current_stage]["inventory"] = val_flt
                                has_explicit_inventory = True

                if not current_stage:
                    continue

                col_c = row[2] if len(row) > 2 else None
                if col_c is None or not str(col_c).strip() or str(col_c).strip().lower() in ['process', 'process name', 'step', 'name', 'nan']:
                    continue

                proc_name = str(col_c).strip()

                # Position mapping: Col D=MT(3), E=UT(4), F=ST(5), G=Op(6), H=CT(7), I=Scrap(8), J=RFT(9), K=Inventory(10), L=Sequence/Flow(11)
                mt_val = safe_float(row[3] if len(row) > 3 else None)
                ut_val = safe_float(row[4] if len(row) > 4 else None)
                st_val = safe_float(row[5] if len(row) > 5 else None)
                op_val = safe_int(row[6] if len(row) > 6 else None)
                ct_val = safe_float(row[7] if len(row) > 7 else None)
                scrap_val = safe_float(row[8] if len(row) > 8 else None)
                rft_val = safe_float(row[9] if len(row) > 9 else None)
                inv_val = safe_float(row[10] if len(row) > 10 else None)
                seq_val = safe_int(row[11] if len(row) > 11 else None)

                if ct_val is not None or mt_val is not None or ut_val is not None:
                    has_explicit_process_data = True

                if inv_val is not None and inv_val >= 0:
                    has_explicit_inventory = True
                    if stages_dict[current_stage]['starting_inventory'] is None:
                        stages_dict[current_stage]['starting_inventory'] = inv_val
                        stages_dict[current_stage]['inventory'] = inv_val

                scrap_norm = (scrap_val / 100.0) if (scrap_val is not None and scrap_val > 1.0) else (scrap_val if scrap_val is not None else 0.0)
                rft_norm = (rft_val / 100.0) if (rft_val is not None and rft_val > 1.0) else (rft_val if rft_val is not None else 1.0)

                metrics = ProcessMetrics(
                    ct=ct_val if ct_val is not None else 0.0,
                    mt=mt_val if mt_val is not None else 0.0,
                    ut=ut_val if ut_val is not None else 0.0,
                    st=st_val if st_val is not None else 0.0,
                    op=op_val if op_val is not None else 1,
                    scrap=scrap_norm,
                    rft=rft_norm,
                    inventory_after=inv_val
                )

                seq = seq_val if seq_val is not None else (len(stages_dict[current_stage]['processes']) + 1)
                proc_id = f"{stages_dict[current_stage]['id']}_p{seq}"

                stages_dict[current_stage]["processes"].append(
                    VSMProcess(
                        id=proc_id,
                        sequence=seq,
                        name=proc_name,
                        metrics=metrics
                    )
                )

            # Fallback check using pandas header mapping if openpyxl positional check found no data
            if not stages_dict or sum(len(s['processes']) for s in stages_dict.values()) == 0:
                df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=data_sheet_name)
                df.columns = [str(c).strip().lower() for c in df.columns]
                
                col_map = {
                    'stage': ['stage', 'subassembly', 'area', 'group'],
                    'process': ['process', 'process name', 'step', 'name'],
                    'sequence': ['sequence', 'seq', 'step_number', 'step #', 'order', 'flow'],
                    'ct': ['c/t', 'ct', 'cycle time', 'cycle_time'],
                    'mt': ['m/t', 'mt', 'machine time', 'machine_time'],
                    'ut': ['u/t', 'ut'],
                    'st': ['s/t', 'st', 'setup time'],
                    'op': ['op', 'operators'],
                    'scrap': ['scrap'],
                    'rft': ['rft'],
                    'inventory': ['inventory', 'wip', 'stock', 'qty', 'inv']
                }
                
                mapped_cols = {}
                for key, options in col_map.items():
                    for col in df.columns:
                        if col in options:
                            mapped_cols[key] = col
                            break

                if 'inventory' in mapped_cols:
                    has_explicit_inventory = True

                if 'process' in mapped_cols and ('ct' in mapped_cols or 'mt' in mapped_cols):
                    has_explicit_process_data = True

                if 'stage' in mapped_cols:
                    has_explicit_vsm_structure = True

                if 'process' in mapped_cols:
                    current_stage = "Default Stage"
                    for _, row in df.iterrows():
                        if 'stage' in mapped_cols:
                            raw_stage = row[mapped_cols['stage']]
                            if not pd.isna(raw_stage) and str(raw_stage).strip() and str(raw_stage).strip().lower() != 'nan':
                                current_stage = str(raw_stage).strip()

                        if current_stage not in stages_dict:
                            stage_id = slugify(current_stage)
                            stages_dict[current_stage] = {
                                "id": stage_id,
                                "name": current_stage,
                                "starting_inventory": None,
                                "inventory": None,
                                "processes": []
                            }

                        raw_proc = row[mapped_cols['process']]
                        if pd.isna(raw_proc) or not str(raw_proc).strip() or str(raw_proc).strip().lower() == 'nan':
                            # Scan non-process rows for stage inventory
                            if 'inventory' in mapped_cols and not pd.isna(row[mapped_cols['inventory']]):
                                try:
                                    inv_num = float(row[mapped_cols['inventory']])
                                    if inv_num >= 0:
                                        stages_dict[current_stage]['starting_inventory'] = inv_num
                                        stages_dict[current_stage]['inventory'] = inv_num
                                        has_explicit_inventory = True
                                except Exception:
                                    pass
                            continue

                        proc_name = str(raw_proc).strip()
                        
                        def get_df_val(key, default=None):
                            if key in mapped_cols and not pd.isna(row[mapped_cols[key]]):
                                try:
                                    val = float(row[mapped_cols[key]])
                                    return val if not pd.isna(val) else default
                                except Exception:
                                    return default
                            return default

                        inv_df_val = get_df_val('inventory', None)
                        if inv_df_val is not None:
                            has_explicit_inventory = True

                        metrics = ProcessMetrics(
                            ct=get_df_val('ct', 0.0) or 0.0,
                            mt=get_df_val('mt', 0.0) or 0.0,
                            ut=get_df_val('ut', 0.0) or 0.0,
                            st=get_df_val('st', 0.0) or 0.0,
                            op=int(get_df_val('op', 1) or 1),
                            scrap=get_df_val('scrap', 0.0) or 0.0,
                            rft=get_df_val('rft', 1.0) or 1.0,
                            inventory_after=inv_df_val
                        )

                        if inv_df_val is not None and stages_dict[current_stage]['starting_inventory'] is None:
                            stages_dict[current_stage]['starting_inventory'] = inv_df_val
                            stages_dict[current_stage]['inventory'] = inv_df_val

                        seq_df = get_df_val('sequence', None)
                        seq = int(seq_df) if seq_df is not None else (len(stages_dict[current_stage]['processes']) + 1)
                        proc_id = f"{stages_dict[current_stage]['id']}_p{seq}"
                        stages_dict[current_stage]["processes"].append(
                            VSMProcess(id=proc_id, sequence=seq, name=proc_name, metrics=metrics)
                        )

            # 3. Post-scan checks across generated stages & processes
            total_processes = sum(len(s['processes']) for s in stages_dict.values())
            if total_processes > 0:
                has_explicit_process_data = True
                has_explicit_process_flow = True # Sequential process steps under stage sections define stage flow

            for stg_data in stages_dict.values():
                if stg_data.get('starting_inventory') is not None or stg_data.get('inventory') is not None:
                    has_explicit_inventory = True
                for p in stg_data.get('processes', []):
                    if p.metrics.inventory_after is not None:
                        has_explicit_inventory = True

            # 4. STRICT VSM DATA VALIDATION
            missing_fields = []
            present_fields = []

            if has_explicit_process_data and total_processes > 0:
                present_fields.append("Process data")
            else:
                missing_fields.append("Process data")

            if has_explicit_process_flow and total_processes > 0:
                present_fields.append("Process flow")
            else:
                missing_fields.append("Process flow")

            if has_explicit_inventory:
                present_fields.append("Inventory information")
            else:
                missing_fields.append("Inventory information")

            if has_explicit_vsm_structure and len(stages_dict) > 0:
                present_fields.append("VSM structure")
            else:
                missing_fields.append("VSM structure")

            if missing_fields:
                error_detail = ImportErrorDetail(
                    code="INSUFFICIENT_VSM_DATA",
                    message="Not enough data provided to generate the VSM.",
                    missing=missing_fields,
                    present=present_fields
                )
                return ImportResult(
                    success=False,
                    errors=[f"Not enough data provided to generate the VSM. Missing: {', '.join(missing_fields)}"],
                    error=error_detail
                )

            stages = [VSMStage(**s) for s in stages_dict.values()]

            # Build Top Hierarchy Nodes & Connections
            nodes = [
                VSMNode(id="supplier", type="processNode", label="Supplier", position={"x": 60, "y": 60}, data={"label": "Supplier", "nodeType": "supplier"}),
                VSMNode(id="customer", type="processNode", label="Customer", position={"x": 900, "y": 60}, data={"label": "Customer", "nodeType": "customer"}),
                VSMNode(id="sales", type="processNode", label="Sales", position={"x": 700, "y": 60}, data={"label": "Sales", "nodeType": "sales"}),
                VSMNode(id="purchasing", type="processNode", label="Purchasing", position={"x": 60, "y": 180}, data={"label": "Purchasing", "nodeType": "purchasing"}),
                VSMNode(id="prod_control", type="processNode", label="Production Control", position={"x": 300, "y": 180}, data={"label": "Production Control", "nodeType": "production_control"}),
                VSMNode(id="single_batch", type="processNode", label="Single Batch", position={"x": 300, "y": 310}, data={"label": "Single Batch", "nodeType": "single_batch"}),
            ]

            connections = [
                VSMConnection(id="e_sup_pur", source="supplier", target="purchasing", direction="forward"),
                VSMConnection(id="e_pur_pc", source="purchasing", target="prod_control", direction="forward"),
                VSMConnection(id="e_cust_sal", source="customer", target="sales", direction="two-way"),
                VSMConnection(id="e_sal_pc", source="sales", target="prod_control", direction="forward"),
                VSMConnection(id="e_pc_sb", source="prod_control", target="single_batch", direction="forward"),
            ]

            start_x = 60
            start_y = 460
            spacing_x = 260
            spacing_y = 160

            prev_stage_id = "single_batch"

            for i, stg in enumerate(stages):
                row_idx = i // 3
                col_idx = i % 3
                curr_x = start_x + (col_idx * spacing_x)
                curr_y = start_y + (row_idx * spacing_y)

                first_proc_metrics = stg.processes[0].metrics.model_dump() if stg.processes else None
                node_type = "package_assembly" if "package" in stg.name.lower() else ("assembly" if "assembly" in stg.name.lower() or "build" in stg.name.lower() else "process")

                nodes.append(
                    VSMNode(
                        id=stg.id,
                        type="processNode",
                        label=stg.name,
                        position={"x": curr_x, "y": curr_y},
                        data={"label": stg.name, "nodeType": node_type, "stageId": stg.id, "metrics": first_proc_metrics, "isStageBox": True},
                        stage_id=stg.id
                    )
                )

                stage_inv = stg.starting_inventory if stg.starting_inventory is not None else stg.inventory
                if stage_inv is None and stg.processes and stg.processes[0].metrics.inventory_after is not None:
                    stage_inv = stg.processes[0].metrics.inventory_after
                if stage_inv is None:
                    stage_inv = 25

                inv_id = f"inv_{stg.id}"
                nodes.append(
                    VSMNode(
                        id=inv_id,
                        type="inventoryNode",
                        label=str(stage_inv),
                        position={"x": curr_x + 135, "y": curr_y - 20},
                        data={"quantity": stage_inv, "inventoryType": "WIP", "stageId": stg.id}
                    )
                )

                connections.append(
                    VSMConnection(id=f"e_{prev_stage_id}_{stg.id}", source=prev_stage_id, target=stg.id, direction="forward")
                )
                prev_stage_id = stg.id

            return ImportResult(
                success=True,
                vsm=VSMModel(
                    id=str(uuid.uuid4()),
                    project={"id": str(uuid.uuid4()), "name": "Imported VSM Project", "product": "Manufacturing Product"},
                    nodes=nodes,
                    connections=connections,
                    stages=stages,
                    metadata={"imported_from": "excel"}
                ),
                stats={"stages": len(stages), "processes": sum(len(s.processes) for s in stages)}
            )
            
        except Exception as e:
            return ImportResult(
                success=False,
                errors=[str(e)],
                error=ImportErrorDetail(
                    code="INSUFFICIENT_VSM_DATA",
                    message=f"Failed to parse Excel file: {str(e)}",
                    missing=["Process data", "Process flow", "Inventory information"],
                    present=[]
                )
            )

class JSONVSMParser:
    def parse(self, data: dict) -> ImportResult:
        try:
            missing_fields = []
            present_fields = []

            stages_data = data.get('stages', [])
            nodes_data = data.get('nodes', [])
            connections_data = data.get('connections', []) or data.get('edges', [])

            has_processes = False
            has_inventory = False
            has_flow = len(connections_data) > 0

            if stages_data:
                present_fields.append("VSM structure")
                for stg in stages_data:
                    if isinstance(stg, dict):
                        if stg.get('starting_inventory') is not None or stg.get('inventory') is not None:
                            has_inventory = True
                        procs = stg.get('processes', [])
                        if procs:
                            has_processes = True
                            has_flow = True
                            for p in procs:
                                if isinstance(p, dict):
                                    m = p.get('metrics', {})
                                    if isinstance(m, dict) and m.get('inventory_after') is not None:
                                        has_inventory = True
            elif nodes_data:
                present_fields.append("VSM structure")
                for n in nodes_data:
                    if isinstance(n, dict) and n.get('type') == 'inventoryNode':
                        has_inventory = True
                    if isinstance(n, dict) and n.get('type') in ['processNode', 'process']:
                        has_processes = True
                        has_flow = True

            if has_processes:
                present_fields.append("Process data")
            else:
                missing_fields.append("Process data")

            if has_flow:
                present_fields.append("Process flow")
            else:
                missing_fields.append("Process flow")

            if has_inventory:
                present_fields.append("Inventory information")
            else:
                missing_fields.append("Inventory information")

            if missing_fields:
                error_detail = ImportErrorDetail(
                    code="INSUFFICIENT_VSM_DATA",
                    message="Not enough data provided to generate the VSM.",
                    missing=missing_fields,
                    present=present_fields
                )
                return ImportResult(
                    success=False,
                    errors=[f"Not enough data provided to generate the VSM. Missing: {', '.join(missing_fields)}"],
                    error=error_detail
                )

            return ImportResult(
                success=True,
                vsm=VSMModel(**data)
            )
        except Exception as e:
            return ImportResult(
                success=False,
                errors=[str(e)],
                error=ImportErrorDetail(
                    code="INSUFFICIENT_VSM_DATA",
                    message=f"Failed to parse JSON model: {str(e)}",
                    missing=["Process data", "Process flow", "Inventory information"],
                    present=[]
                )
            )
