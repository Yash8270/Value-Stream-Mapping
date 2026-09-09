from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.vsm_service import VSMService
from app.exporters.pdf_exporter import VSMPDFExporter
from app.exporters.png_exporter import VSMPNGExporter

router = APIRouter()
vsm_service = VSMService()
pdf_exporter = VSMPDFExporter()
png_exporter = VSMPNGExporter()

@router.post("/{vsm_id}/export/pdf")
def export_pdf(vsm_id: str, db: Session = Depends(get_db)):
    vsm = vsm_service.get_vsm(db, vsm_id)
    if not vsm:
        raise HTTPException(status_code=404, detail="VSM not found")
        
    pdf_bytes = pdf_exporter.export(vsm)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=vsm_{vsm_id}.pdf"})

@router.post("/{vsm_id}/export/png")
def export_png(vsm_id: str, db: Session = Depends(get_db)):
    vsm = vsm_service.get_vsm(db, vsm_id)
    if not vsm:
        raise HTTPException(status_code=404, detail="VSM not found")
        
    png_bytes = png_exporter.export(vsm)
    return Response(content=png_bytes, media_type="image/png", headers={"Content-Disposition": f"attachment; filename=vsm_{vsm_id}.png"})

@router.get("/{vsm_id}/export/json")
def export_json(vsm_id: str, db: Session = Depends(get_db)):
    vsm = vsm_service.get_vsm(db, vsm_id)
    if not vsm:
        raise HTTPException(status_code=404, detail="VSM not found")
        
    return JSONResponse(content=vsm.model_dump())
