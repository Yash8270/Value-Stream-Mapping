import pytest
from pathlib import Path
from app.parsers.excel_parser import ExcelVSMParser

BASE_DIR = Path(__file__).resolve().parent.parent
EXCEL_FILE = BASE_DIR / 'VSM_Fibre-Q_2024.xlsx'

def test_excel_stage_processes():
    if not EXCEL_FILE.exists():
        pytest.skip("Test Excel workbook VSM_Fibre-Q_2024.xlsx not found")

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
