from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.vsm import VSMModel, VSMCreateRequest, VSMUpdateRequest
from app.services.vsm_service import VSMService
from app.vsm.validator import validate_vsm

router = APIRouter()
vsm_service = VSMService()

@router.post("/generate", response_model=VSMModel)
def generate_vsm(request: VSMCreateRequest, db: Session = Depends(get_db)):
    vsm = vsm_service.generate_from_stages(
        stages=request.stages,
        connections=request.connections or [],
        project=request.project
    )
    vsm_service.save_vsm(db, vsm)
    return vsm

@router.post("/manual", response_model=VSMModel)
def generate_vsm_manual(request: VSMCreateRequest, db: Session = Depends(get_db)):
    vsm = vsm_service.generate_from_stages(
        stages=request.stages,
        connections=request.connections or [],
        project=request.project
    )
    vsm.metadata["is_manual"] = True
    vsm_service.save_vsm(db, vsm)
    return vsm

@router.get("/", response_model=List[VSMModel])
def list_vsms(db: Session = Depends(get_db)):
    return vsm_service.list_vsms(db)

@router.get("/{vsm_id}", response_model=VSMModel)
def get_vsm(vsm_id: str, db: Session = Depends(get_db)):
    vsm = vsm_service.get_vsm(db, vsm_id)
    if not vsm:
        raise HTTPException(status_code=404, detail="VSM not found")
    return vsm

@router.put("/{vsm_id}", response_model=VSMModel)
def update_vsm(vsm_id: str, update: VSMUpdateRequest, db: Session = Depends(get_db)):
    vsm = vsm_service.update_vsm(db, vsm_id, update)
    if not vsm:
        raise HTTPException(status_code=404, detail="VSM not found")
    return vsm

@router.delete("/{vsm_id}")
def delete_vsm(vsm_id: str, db: Session = Depends(get_db)):
    success = vsm_service.delete_vsm(db, vsm_id)
    if not success:
        raise HTTPException(status_code=404, detail="VSM not found")
    return {"status": "ok"}

@router.post("/validate")
def validate_vsm_endpoint(vsm: VSMModel):
    return validate_vsm(vsm.model_dump())
