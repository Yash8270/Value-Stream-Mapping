# VSM Studio

A professional **Value Stream Mapping** editor for manufacturing environments. Import manufacturing data from Excel or create VSMs manually, then edit, refine, and export as PDF, PNG, or JSON.

## Architecture

```
VSM Studio
├── frontend/     React + Vite + TypeScript + @xyflow/react + Zustand
└── backend/      Python + FastAPI + SQLite + pandas + ReportLab
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Opens at http://localhost:5173

### Backend
```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
API available at http://localhost:8000
Docs at http://localhost:8000/docs

## Features

- **Interactive Canvas** – Drag, zoom, pan, connect VSM elements
- **Custom VSM Nodes** – Process, Assembly, Quality, Inventory triangles, Supplier, Customer, Single Batch, etc.
- **Properties Panel** – Edit C/T, M/T, U/T, S/T, Op, Scrap, RFT per process
- **Timeline** – Rectangular wave timeline, normalized visual widths, yellow wait highlighting
- **Excel Import** – Upload Excel workbook, auto-detect columns, preserve process order
- **JSON Import/Export** – Full model serialization
- **PDF/PNG Export** – Backend-generated professional exports
- **Undo/Redo** – Full history with Ctrl+Z / Ctrl+Shift+Z
- **Save/Load** – localStorage draft + SQLite persistence

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/health | Health check |
| POST | /api/v1/import/excel | Upload Excel workbook |
| POST | /api/v1/import/json | Import JSON VSM |
| POST | /api/v1/vsm/generate | Generate VSM from stages |
| GET | /api/v1/vsm/ | List all saved VSMs |
| GET | /api/v1/vsm/{id} | Get VSM by ID |
| PUT | /api/v1/vsm/{id} | Update VSM |
| DELETE | /api/v1/vsm/{id} | Delete VSM |
| POST | /api/v1/vsm/{id}/export/pdf | Export as PDF |
| POST | /api/v1/vsm/{id}/export/png | Export as PNG |
| GET | /api/v1/vsm/{id}/export/json | Export as JSON |

## VSM JSON Model

```json
{
  "id": "unique-id",
  "project": { "name": "My VSM", "product": "Product X" },
  "nodes": [],
  "connections": [],
  "stages": [
    {
      "id": "stage_id",
      "name": "Stage Name",
      "inventory": 35,
      "processes": [
        {
          "id": "proc_id",
          "name": "Process Name",
          "metrics": {
            "ct": 0.49, "mt": 0, "ut": 0.46, "st": 0.03,
            "op": 1, "scrap": 0, "rft": 1.0, "inventory_after": null
          }
        }
      ]
    }
  ]
}
```

## Key Rules

1. **Process order** is preserved from the stage process array order
2. **Inventory** values are independent data, never calculated from RFT
3. **Timeline** uses equal normalized visual widths (C/T is a label, not a drawing unit)
4. **Backend** is optional – frontend works standalone with demo data

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Delete / Backspace | Delete selected |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+D | Duplicate |
| Ctrl+S | Save |

## Excel Import

Your Excel workbook should have a sheet named `Data`, `VSM`, or `Processes` with columns:
- Stage / Subassembly / Area / Group
- Process / Process Name / Step
- C/T or CT (Cycle Time)
- M/T or MT (Machine/Wait Time)
- U/T or UT
- S/T or ST (Setup Time)
- Op (Operators)
- Scrap
- RFT
- Inventory / WIP / Stock

Column names are detected flexibly. Row order determines process order.
