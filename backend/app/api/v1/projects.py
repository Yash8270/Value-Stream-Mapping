from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.vsm import VSMProject
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListItem
from app.core.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[ProjectListItem])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(VSMProject).filter(VSMProject.user_id == current_user.id).order_by(VSMProject.updated_at.desc()).all()
    return projects

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    default_model = project_in.initial_model or {
        "id": "new",
        "project": {"id": "new", "name": project_in.name, "product": "Manufacturing Line"},
        "nodes": [],
        "connections": [],
        "stages": [],
        "metadata": {}
    }

    new_project = VSMProject(
        user_id=current_user.id,
        name=project_in.name.strip(),
        description=project_in.description,
        source_type=project_in.source_type or "MANUAL",
        current_model=default_model
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(VSMProject).filter(
        VSMProject.id == project_id,
        VSMProject.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(VSMProject).filter(
        VSMProject.id == project_id,
        VSMProject.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )

    if project_in.name is not None:
        project.name = project_in.name.strip()
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.current_model is not None:
        project.current_model = project_in.current_model

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(VSMProject).filter(
        VSMProject.id == project_id,
        VSMProject.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )

    db.delete(project)
    db.commit()
    return {"success": True, "message": f"Project '{project.name}' deleted successfully"}
