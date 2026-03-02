"""
Verification module management routes - scholars create and manage research questions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User, Project, VerificationModule, ModuleCaseSample, ValidatorAssignment, CourtCase
from app.schemas import (
    VerificationModuleCreate, 
    VerificationModuleResponse, 
    VerificationModuleUpdate
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/modules", tags=["Verification Modules"])


@router.post("/projects/{project_id}/modules", response_model=VerificationModuleResponse, status_code=status.HTTP_201_CREATED)
def create_module(
    project_id: int,
    module_data: VerificationModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new verification module (research question).
    Only the assigned scholar can create modules.
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify user is the assigned scholar or admin
    if current_user.role.value == "scholar":
        if project.scholar_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the assigned scholar can create modules for this project"
            )
    elif current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only scholars or admins can create modules")
    
    # Validate answer_options for multiple_choice
    if module_data.answer_type == "multiple_choice":
        if not module_data.answer_options or len(module_data.answer_options) < 2:
            raise HTTPException(
                status_code=400,
                detail="Multiple choice questions must have at least 2 answer options"
            )
    
    # Get next module number
    max_module = db.query(VerificationModule).filter(
        VerificationModule.project_id == project_id
    ).order_by(VerificationModule.module_number.desc()).first()
    
    next_module_number = (max_module.module_number + 1) if max_module else 1
    
    # Create module
    new_module = VerificationModule(
        project_id=project_id,
        module_number=next_module_number,
        module_name=module_data.module_name,
        question_text=module_data.question_text,
        answer_type=module_data.answer_type,
        answer_options=module_data.answer_options,
        module_context=module_data.module_context,
        sample_size=module_data.sample_size,
        status="draft"
    )
    
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    
    return new_module


@router.get("/projects/{project_id}/modules", response_model=List[VerificationModuleResponse])
def list_modules(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all modules for a project.
    """
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get modules ordered by module_number
    modules = db.query(VerificationModule).filter(
        VerificationModule.project_id == project_id
    ).order_by(VerificationModule.module_number).all()
    
    return modules


@router.get("/modules/{module_id}", response_model=VerificationModuleResponse)
def get_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific module by ID.
    """
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    return module


@router.patch("/modules/{module_id}", response_model=VerificationModuleResponse)
def update_module(
    module_id: int,
    module_data: VerificationModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a verification module.
    Only the assigned scholar can update modules.
    """
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get project to check permissions
    project = db.query(Project).filter(Project.id == module.project_id).first()
    
    # Verify user is the assigned scholar or admin
    if current_user.role.value == "scholar":
        if project.scholar_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the assigned scholar can update this module")
    elif current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only scholars or admins can update modules")
    
    # Don't allow updates if module is beyond draft status
    if module.status not in ["draft", "sampling_complete"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update module in {module.status} status"
        )
    
    # Update fields
    if module_data.module_name is not None:
        module.module_name = module_data.module_name
    if module_data.question_text is not None:
        module.question_text = module_data.question_text
    if module_data.answer_type is not None:
        module.answer_type = module_data.answer_type
    if module_data.answer_options is not None:
        module.answer_options = module_data.answer_options
    if module_data.module_context is not None:
        module.module_context = module_data.module_context
    if module_data.sample_size is not None:
        module.sample_size = module_data.sample_size
    
    module.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(module)
    
    return module


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a verification module.
    Only the assigned scholar or admin can delete.
    """
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get project to check permissions
    project = db.query(Project).filter(Project.id == module.project_id).first()
    
    # Verify user is the assigned scholar or admin
    if current_user.role.value == "scholar":
        if project.scholar_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the assigned scholar can delete this module")
    elif current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only scholars or admins can delete modules")
    
    # Delete module (cascade will delete related records)
    db.delete(module)
    db.commit()
    
    return None


@router.post("/modules/{module_id}/sample-cases")
def sample_cases(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate random case sample for a module.
    Randomly selects N cases from project's cases where N = module.sample_size.
    """
    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check permissions
    project = db.query(Project).filter(Project.id == module.project_id).first()
    if current_user.role.value == "scholar" and project.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned scholar can sample cases")
    elif current_user.role.value not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if already sampled
    existing_samples = db.query(ModuleCaseSample).filter(
        ModuleCaseSample.module_id == module_id
    ).count()
    
    if existing_samples > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cases already sampled for this module. Delete existing samples first."
        )
    
    # Get random cases from project
    random_cases = db.query(CourtCase).filter(
        CourtCase.project_id == module.project_id
    ).order_by(func.random()).limit(module.sample_size).all()
    
    if len(random_cases) < module.sample_size:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough cases in project. Need {module.sample_size}, found {len(random_cases)}"
        )
    
    # Create samples
    for idx, case in enumerate(random_cases, 1):
        sample = ModuleCaseSample(
            module_id=module_id,
            case_id=case.id,
            sample_order=idx
        )
        db.add(sample)
    
    # Update module status
    module.status = "sampling_complete"
    db.commit()
    
    return {
        "success": True,
        "message": f"Sampled {len(random_cases)} cases for module",
        "sampled_count": len(random_cases)
    }


@router.post("/modules/{module_id}/assign-validator")
def assign_validator(
    module_id: int,
    validator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assign a validator to a module.
    Creates validator_assignments for all sampled cases in this module.
    """
    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check permissions
    project = db.query(Project).filter(Project.id == module.project_id).first()
    if current_user.role.value == "scholar" and project.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned scholar can assign validators")
    elif current_user.role.value not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Verify validator exists
    validator = db.query(User).filter(User.id == validator_id).first()
    if not validator or validator.role.value != "validator":
        raise HTTPException(status_code=400, detail="Invalid validator")
    
    # Check if cases are sampled
    samples = db.query(ModuleCaseSample).filter(
        ModuleCaseSample.module_id == module_id
    ).all()
    
    if not samples:
        raise HTTPException(
            status_code=400,
            detail="Must sample cases before assigning validator"
        )
    
    # Check if validator already assigned
    existing = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Validator already assigned. Unassign first to change."
        )
    
    # Create assignments for each sampled case
    for sample in samples:
        assignment = ValidatorAssignment(
            module_id=module_id,
            case_id=sample.case_id,
            validator_id=validator_id,
            status="pending"
        )
        db.add(assignment)
    
    # Update module status
    module.status = "ready_for_validation"
    db.commit()
    
    return {
        "success": True,
        "message": f"Assigned {validator.email} to validate {len(samples)} cases",
        "validator_email": validator.email,
        "case_count": len(samples)
    }


@router.get("/modules/{module_id}/assignments")
def get_module_assignments(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get validator assignment info for a module.
    """
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get sample count
    sample_count = db.query(ModuleCaseSample).filter(
        ModuleCaseSample.module_id == module_id
    ).count()
    
    # Get validator assignment
    assignment = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id
    ).first()
    
    validator_info = None
    if assignment:
        validator = db.query(User).filter(User.id == assignment.validator_id).first()
        if validator:
            validator_info = {
                "id": validator.id,
                "email": validator.email,
                "full_name": validator.full_name
            }
    
    return {
        "module_id": module_id,
        "sample_count": sample_count,
        "sampled": sample_count > 0,
        "validator": validator_info
    }