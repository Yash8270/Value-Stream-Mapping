import io
import pytest
import openpyxl
from app.parsers.excel_parser import ExcelVSMParser, JSONVSMParser

pytestmark = pytest.mark.unit


def test_excel_import_validation_missing_flow_and_inventory():
    """Excel workbook with process data but without explicit flow/inventory columns should fail validation."""
    parser = ExcelVSMParser()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Data"
    ws.append(["Stage", "Detail", "Process", "M/T", "U/T", "S/T", "Op", "C/T", "Scrap", "RFT"])
    ws.append(["Fibre Prep", "1", "Measure Fibre", 0, 0.46, 0.03, 1, 0.49, 0, 100])
    ws.append(["Fibre Prep", "2", "Clean Fibre", 0, 0.42, 0.03, 1, 0.45, 0, 100])

    stream = io.BytesIO()
    wb.save(stream)
    file_bytes = stream.getvalue()

    result = parser.parse(file_bytes)

    assert result.success is False, "Import should fail when required VSM flow or inventory data is missing"
    assert result.error is not None, "Structured error details must be returned"
    assert result.error.code == "INSUFFICIENT_VSM_DATA"
    assert "Process data" in result.error.present
    assert "Inventory information" in result.error.missing


def test_excel_import_validation_invalid_file_bytes():
    """Non-excel file bytes should fail gracefully without unhandled exceptions."""
    parser = ExcelVSMParser()
    result = parser.parse(b"corrupted raw binary content not a zip or excel")

    assert result.success is False
    assert result.error is not None
    assert result.error.code == "INSUFFICIENT_VSM_DATA"


def test_json_import_validation_incomplete_data():
    """JSON payload missing inventory or connections should fail validation."""
    json_parser = JSONVSMParser()
    incomplete_data = {
        "stages": [
            {
                "name": "Stage 1",
                "processes": [{"name": "Process 1", "metrics": {"ct": 1.0}}]
            }
        ]
    }

    result = json_parser.parse(incomplete_data)

    assert result.success is False, "Validation must reject JSON missing inventory information"
    assert result.error is not None
    assert result.error.code == "INSUFFICIENT_VSM_DATA"
    assert "Inventory information" in result.error.missing


def test_json_import_validation_complete_data():
    """Complete JSON payload with stages, inventory, and connections should succeed."""
    json_parser = JSONVSMParser()
    valid_data = {
        "id": "vsm_val_test",
        "project": {"id": "p1", "name": "Test Project", "product": "Widget"},
        "stages": [
            {
                "id": "stage_1",
                "name": "Assembly",
                "inventory": 50,
                "processes": [
                    {
                        "id": "p1",
                        "sequence": 1,
                        "name": "Assemble Parts",
                        "metrics": {"ct": 2.5, "mt": 0.5, "ut": 2.0, "st": 0.1, "op": 1, "scrap": 0.01, "rft": 0.99, "inventory_after": 50}
                    }
                ]
            }
        ],
        "connections": [
            {"id": "c1", "source": "supplier", "target": "stage_1", "direction": "forward"}
        ]
    }

    result = json_parser.parse(valid_data)

    assert result.success is True, f"Valid JSON should parse successfully, got errors: {result.errors}"
    assert result.vsm is not None
    assert len(result.vsm.stages) == 1
    assert result.vsm.stages[0].name == "Assembly"
    assert len(result.vsm.stages[0].processes) == 1
    assert result.vsm.stages[0].processes[0].name == "Assemble Parts"
