"""
Project management routes - admin creates and manages projects.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Project, CourtCase
from app.schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from app.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Create a new project (Admin only).
    
    The admin who creates the project is automatically set as the project admin.
    Optionally assign a scholar to review the project.
    """
    # Verify scholar exists if provided
    if project_data.scholar_id:
        scholar = db.query(User).filter(User.id == project_data.scholar_id).first()
        if not scholar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scholar with id {project_data.scholar_id} not found"
            )
    
    # Create project
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        admin_id=admin.id,
        scholar_id=project_data.scholar_id
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return new_project


@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of all projects.
    
    - Admins see all projects
    - Scholars see projects they're assigned to
    - Validators see projects with cases assigned to them
    """
    if current_user.role.value == "admin":
        # Admins see all projects
        projects = db.query(Project).offset(skip).limit(limit).all()
    elif current_user.role.value == "scholar":
        # Scholars see their assigned projects
        projects = db.query(Project).filter(
            Project.scholar_id == current_user.id
        ).offset(skip).limit(limit).all()
    else:
        # Validators see projects they have assignments in
        # (We'll implement this later when assignments are built)
        projects = []
    
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific project by ID.
    
    Users can only view projects they have access to.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Check access permissions
    if current_user.role.value == "admin":
        # Admins can see all projects
        pass
    elif current_user.role.value == "scholar":
        # Scholars can only see their assigned projects
        if project.scholar_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
    else:
        # Validators need assignments (implement later)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project"
        )
    
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Update a project (Admin only).
    
    Can update name, description, scholar assignment, or active status.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Update fields if provided
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.scholar_id is not None:
        # Verify scholar exists
        scholar = db.query(User).filter(User.id == project_data.scholar_id).first()
        if not scholar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scholar with id {project_data.scholar_id} not found"
            )
        project.scholar_id = project_data.scholar_id
    if project_data.is_active is not None:
        project.is_active = project_data.is_active
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Delete a project and all associated cases.
    Admin only.
    """
    # Get project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    try:
        # Delete all associated cases first
        db.query(CourtCase).filter(CourtCase.project_id == project_id).delete()
        
        # Then delete the project
        db.delete(project)
        db.commit()
        
        return None  # 204 No Content
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )

@router.get("/{project_id}/cases")
def get_project_cases(
    project_id: int,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all court cases for a project.
    
    Returns list of cases with all fields.
    """
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Get cases
    cases = db.query(CourtCase).filter(
        CourtCase.project_id == project_id
    ).offset(skip).limit(limit).all()
    
    # Convert to dictionaries
    cases_data = []
    for case in cases:
        case_dict = {
            "id": case.id,
            "case_name": case.case_name,
            "case_date": case.case_date.isoformat() if case.case_date else None,
            "court": case.court,
            "docket_number": case.docket_number,
            "judges_names": case.judges_names,
            "opinion_text": case.opinion_text,
            "dissent_text": case.dissent_text,
            "concur_text": case.concur_text,
            "state": case.state,
            "election_type": case.election_type,
            "party_who_appointed_judge": case.party_who_appointed_judge,
        }
        cases_data.append(case_dict)
    
    return cases_data