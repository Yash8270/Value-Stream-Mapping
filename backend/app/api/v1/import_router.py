import uuid
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.parsers.excel_parser import ExcelVSMParser, JSONVSMParser
from app.schemas.vsm import ImportResult
from app.models.user import User
from app.models.vsm import VSMProject
from app.models.imported_data import ImportedData
from app.core.auth import get_current_user

router = APIRouter()
excel_parser = ExcelVSMParser()
json_parser = JSONVSMParser()

@router.post("/excel", response_model=ImportResult)
async def import_excel_standalone(
    file: UploadFile = File(...)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": "INVALID_FILE_TYPE",
                    "message": "Must be an Excel file (.xlsx or .xls)",
                    "missing": ["Valid Excel format"],
                    "present": []
                }
            }
        )
        
    content = await file.read()
    result = excel_parser.parse(content)
    
    if not result.success:
        res_dict = result.model_dump() if hasattr(result, 'model_dump') else result.dict()
        return JSONResponse(status_code=400, content=res_dict)
        
    return result

@router.post("/json", response_model=ImportResult)
def import_json_standalone(data: Dict[str, Any]):
    result = json_parser.parse(data)
    if not result.success:
        res_dict = result.model_dump() if hasattr(result, 'model_dump') else result.dict()
        return JSONResponse(status_code=400, content=res_dict)
        
    return result

@router.post("/projects/{project_id}/import/excel", response_model=ImportResult)
async def import_excel_for_project(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(VSMProject).filter(
        VSMProject.id == project_id,
        VSMProject.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied")

    if not file.filename.endswith(('.xlsx', '.xls')):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": "INVALID_FILE_TYPE",
                    "message": "Must be an Excel file (.xlsx or .xls)",
                    "missing": ["Valid Excel format"],
                    "present": []
                }
            }
        )

    content = await file.read()
    file_size = len(content)

    import_record = ImportedData(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        project_id=project.id,
        file_name=file.filename,
        file_type="EXCEL",
        file_size=file_size,
        import_status="PROCESSING"
    )
    db.add(import_record)
    db.commit()

    result = excel_parser.parse(content)

    if not result.success:
        import_record.import_status = "FAILED"
        import_record.error_message = result.errors[0] if result.errors else "Excel parse failed"
        db.commit()
        
        res_dict = result.model_dump() if hasattr(result, 'model_dump') else result.dict()
        return JSONResponse(status_code=400, content=res_dict)

    vsm_dict = result.vsm.model_dump() if hasattr(result.vsm, 'model_dump') else result.vsm.dict()
    
    project.current_model = vsm_dict
    project.source_type = "EXCEL"
    
    import_record.import_status = "COMPLETED"
    import_record.parsed_data = vsm_dict
    db.commit()

    return result

@router.post("/projects/{project_id}/import/json", response_model=ImportResult)
async def import_json_for_project(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(VSMProject).filter(
        VSMProject.id == project_id,
        VSMProject.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied")

    content = await file.read()
    try:
        data = json.loads(content.decode('utf-8'))
    except Exception:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": "INVALID_JSON",
                    "message": "File is not valid JSON format",
                    "missing": ["Valid JSON structure"],
                    "present": []
                }
            }
        )

    result = json_parser.parse(data)
    if not result.success:
        res_dict = result.model_dump() if hasattr(result, 'model_dump') else result.dict()
        return JSONResponse(status_code=400, content=res_dict)

    vsm_dict = result.vsm.model_dump() if hasattr(result.vsm, 'model_dump') else result.vsm.dict()

    project.current_model = vsm_dict
    project.source_type = "JSON"

    import_record = ImportedData(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        project_id=project.id,
        file_name=file.filename or "import.json",
        file_type="JSON",
        file_size=len(content),
        parsed_data=vsm_dict,
        import_status="COMPLETED"
    )
    db.add(import_record)
    db.commit()

    return result
