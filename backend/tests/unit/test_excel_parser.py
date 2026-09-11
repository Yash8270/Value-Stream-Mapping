import pytest
from pathlib import Path
from app.parsers.excel_parser import ExcelVSMParser

BASE_DIR = Path(__file__).resolve().parents[2]
EXCEL_FILE = BASE_DIR / 'VSM_Fibre-Q_2024.xlsx'

pytestmark = pytest.mark.unit


def test_excel_stage_processes():
    """Verify that the Excel workbook parses successfully and all stages have processes."""
    if not EXCEL_FILE.exists():
        pytest.skip(f"Test Excel workbook not found at {EXCEL_FILE}")

    with open(EXCEL_FILE, "rb") as f:
        content = f.read()

    parser = ExcelVSMParser()
    result = parser.parse(content)

    assert result.success is True
    assert result.vsm is not None
    assert len(result.vsm.stages) > 0

    fibre_prep = next((s for s in result.vsm.stages if s.name == "Fibre Prep"), None)
    assert fibre_prep is not None, "Fibre Prep stage must be found in Excel data"
    assert len(fibre_prep.processes) > 1, f"Fibre Prep should have multiple processes, found {len(fibre_prep.processes)}"

    first_proc = fibre_prep.processes[0]
    assert first_proc.sequence == 1
    assert first_proc.name != ""
    assert first_proc.metrics.ct is not None

    for stage in result.vsm.stages:
        assert len(stage.processes) > 0, f"Stage {stage.name} should have at least 1 process"


def test_excel_stages_and_inventory():
    """Verify that parsed stages include expected manufacturing stages and valid inventory nodes on canvas."""
    if not EXCEL_FILE.exists():
        pytest.skip(f"Test Excel workbook not found at {EXCEL_FILE}")

    with open(EXCEL_FILE, "rb") as f:
        content = f.read()

    parser = ExcelVSMParser()
    result = parser.parse(content)

    assert result.success is True
    stage_names = [s.name for s in result.vsm.stages]

    # Core manufacturing stages should be detected
    for expected in ["Fibre Prep", "Cell Build", "Package Assembly", "Collimator Assembly"]:
        assert expected in stage_names, f"Expected stage '{expected}' in parsed stages: {stage_names}"

    # Verify inventory nodes exist on canvas for each stage
    inv_nodes = [n for n in result.vsm.nodes if n.type == "inventoryNode"]
    assert len(inv_nodes) == len(result.vsm.stages), "Each stage should have a corresponding inventory node"

    for inv in inv_nodes:
        qty = inv.data.get("quantity")
        assert qty is not None and qty > 0, f"Inventory node {inv.id} must have positive quantity"
