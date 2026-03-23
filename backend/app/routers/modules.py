"""
Verification module management routes - scholars create and manage research questions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime
from typing import Optional
import random
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Project, VerificationModule, ModuleCaseSample, ValidatorAssignment, CourtCase, AIAnalysis, ValidationFeedback, FeedbackLibrary
from app.schemas import (
    VerificationModuleCreate, 
    VerificationModuleResponse, 
    VerificationModuleUpdate
)
from app.dependencies import get_current_user


class ReviewCorrectionRequest(BaseModel):
    validation_id: int
    approve: bool
    scholar_notes: Optional[str] = None

router = APIRouter(prefix="/modules", tags=["Verification Modules"])


@router.get("/ai-providers")
def get_ai_providers():
    """Get list of available AI providers"""
    providers = [
        {"value": "dummy", "label": "Dummy AI (Testing)"},
        {"value": "groq-llama-8b", "label": "⚡ Llama 3.1 8B Instant (Groq - Fast)"},
        {"value": "groq-llama-70b", "label": "🎯 Llama 3.3 70B Versatile (Groq - Recommended)"},
        {"value": "groq-llama-405b", "label": "🔥 Llama 4 Maverick 17B (Groq - Best Quality)"}
    ]
    
    return {
        "providers": providers,
        "default": "groq-llama-70b"
    }


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
    
    
    # Validate AI provider
    VALID_PROVIDERS = ["dummy", "groq-llama-8b", "groq-llama-70b", "groq-llama-405b"]

    if module_data.ai_provider not in VALID_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid AI provider. Must be one of: {VALID_PROVIDERS}"
        )
    
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
        ai_provider=module_data.ai_provider,
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

@router.post("/modules/{module_id}/clone", response_model=VerificationModuleResponse, status_code=status.HTTP_201_CREATED)
def clone_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clone an existing module into a new draft module.
    Copies: question_text, answer_type, answer_options, module_context,
            sample_size, ai_provider, and validator assignment (if any).
    Leaves module_name blank for the scholar to fill in.
    """
    # Get source module
    source = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Module not found")

    # Permission check
    project = db.query(Project).filter(Project.id == source.project_id).first()
    if current_user.role.value == "scholar":
        if project.scholar_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the assigned scholar can clone modules")
    elif current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only scholars or admins can clone modules")

    # Get next module number
    max_module = db.query(VerificationModule).filter(
        VerificationModule.project_id == source.project_id
    ).order_by(VerificationModule.module_number.desc()).first()
    next_module_number = (max_module.module_number + 1) if max_module else 1

    # Create cloned module (name left blank)
    cloned = VerificationModule(
        project_id=source.project_id,
        module_number=next_module_number,
        module_name="",                          # blank — scholar must fill in
        question_text=source.question_text,
        answer_type=source.answer_type,
        answer_options=source.answer_options,
        module_context=source.module_context,
        sample_size=source.sample_size,
        ai_provider=source.ai_provider,
        status="draft"
    )
    db.add(cloned)
    db.flush()  # get cloned.id before commit

    # Copy validator assignment if one exists
    existing_assignment = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id
    ).first()
    if existing_assignment:
        new_assignment = ValidatorAssignment(
            module_id=cloned.id,
            validator_id=existing_assignment.validator_id,
            case_id=existing_assignment.case_id  # will be None/0 at draft stage
        )
        db.add(new_assignment)

    db.commit()
    db.refresh(cloned)
    return cloned


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
    Validator will review cases after module is launched.
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
    
    # Verify validator exists and has validator role
    validator = db.query(User).filter(User.id == validator_id).first()
    if not validator:
        raise HTTPException(status_code=404, detail="Validator not found")
    
    if validator.role.value != "validator":
        raise HTTPException(
            status_code=400,
            detail=f"User {validator.email} is not a validator"
        )
    
    # Check if validator already assigned
    existing = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id
    ).first()
    
    if existing:
        # Update existing assignment
        existing.validator_id = validator_id
        db.commit()
        message = f"Validator updated to {validator.email}"
    else:
        # Create new validator assignment (one per module, not per case)
        assignment = ValidatorAssignment(
            module_id=module_id,
            validator_id=validator_id
        )
        db.add(assignment)
        db.commit()
        message = f"Validator {validator.email} assigned successfully"
    
    # Don't change module status here - it will change when module is launched
    
    return {
        "success": True,
        "message": message,
        "validator_email": validator.email
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
    
    # Get validator assignment (just the first one for module-level info)
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

    # Count how many cases the validator has completed
    completed_cases = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id,
        ValidatorAssignment.status == "completed"
    ).count()

    # Count pending corrections (incorrect validations not yet reviewed by scholar)
    corrections_pending = db.query(ValidationFeedback).join(
        ValidatorAssignment,
        ValidationFeedback.assignment_id == ValidatorAssignment.id
    ).filter(
        ValidatorAssignment.module_id == module_id,
        ValidationFeedback.is_correct == False,
        ValidationFeedback.scholar_reviewed == False
    ).count()

    # Validator has finished when all sampled cases are completed
    validator_finished = sample_count > 0 and completed_cases >= sample_count

    return {
        "module_id": module_id,
        "sample_count": sample_count,
        "sampled": sample_count > 0,
        "validator": validator_info,
        "completed_cases": completed_cases,
        "corrections_pending": corrections_pending,
        "validator_finished": validator_finished,
    }

@router.post("/modules/{module_id}/launch-mock-ai")
def launch_mock_ai_analysis(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate mock AI analyses for all sampled cases in a module.
    Creates realistic dummy answers for testing validator workflow.
    """
    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check permissions (assigned scholar or admin)
    project = db.query(Project).filter(Project.id == module.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role.value == "scholar" and project.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned scholar can launch AI analysis")
    elif current_user.role.value not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if cases are sampled
    samples = db.query(ModuleCaseSample).filter(
        ModuleCaseSample.module_id == module_id
    ).all()
    
    if not samples:
        raise HTTPException(status_code=400, detail="Must sample cases before launching AI analysis")
    
    # Check if validator assigned
    validator_assigned = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id
    ).first()
    
    if not validator_assigned:
        raise HTTPException(status_code=400, detail="Must assign validator before launching AI analysis")
    
    # Check if AI already ran
    existing_analyses = db.query(AIAnalysis).filter(
        AIAnalysis.module_id == module_id
    ).count()
    
    if existing_analyses > 0:
        raise HTTPException(status_code=400, detail="AI analysis already completed for this module")
    
    # Update module status to analyzing
    module.status = "ai_analyzing"
    db.commit()
    
    # Generate mock AI analyses for each sampled case
    for sample in samples:
        # Generate mock answer based on answer type
        if module.answer_type == "yes_no":
            mock_answer = random.choice(["Yes", "No"])
            confidence = random.randint(75, 95) / 100.0
            reasoning = f"Based on analysis of the opinion text, the evidence {'supports' if mock_answer == 'Yes' else 'does not support'} an affirmative answer. Found {random.randint(2, 5)} relevant passages."
        
        elif module.answer_type == "multiple_choice":
            mock_answer = random.choice(module.answer_options)
            confidence = random.randint(70, 95) / 100.0
            reasoning = f"Analysis indicates '{mock_answer}' based on {random.randint(3, 7)} mentions of related keywords and contextual evidence in the opinion."
        
        elif module.answer_type == "integer":
            mock_answer = str(random.randint(1, 100))
            confidence = random.randint(65, 90) / 100.0
            reasoning = f"Calculated value of {mock_answer} based on temporal analysis and date references found in the case text."
        
        elif module.answer_type == "date":
            mock_answer = f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
            confidence = random.randint(70, 90) / 100.0
            reasoning = f"Date extracted from opinion text based on explicit temporal references."
        
        else:  # text
            mock_answer = f"Mock analysis result for case {sample.case_id}"
            confidence = random.randint(60, 85) / 100.0
            reasoning = "Free-form analysis based on comprehensive review of case content and legal reasoning."
        
        # Create AI analysis record
        analysis = AIAnalysis(
            module_id=module_id,
            case_id=sample.case_id,
            ai_answer=mock_answer,
            ai_reasoning=reasoning,
            ai_confidence=confidence,
            ai_round=1,
            model_used="mock-ai-v1",
            tokens_used=random.randint(500, 1500),
            cost=random.randint(5, 25) / 1000.0  # $0.005 - $0.025
        )
        db.add(analysis)
    
    # Update module status to validation in progress
    module.status = "validation_in_progress"
    db.commit()
    
    return {
        "success": True,
        "message": f"Mock AI analysis completed for {len(samples)} cases",
        "analyzed_count": len(samples),
        "model": "mock-ai-v1"
    }


@router.get("/validators/my-assignments")
def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all modules assigned to the current validator.
    Shows across all projects.
    """
    if current_user.role.value != "validator":
        raise HTTPException(status_code=403, detail="Only validators can access this endpoint")
    
    # Get all assignments for this validator
    assignments = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.validator_id == current_user.id
    ).all()
    
    # Group by module to get unique modules
    module_ids = list(set([a.module_id for a in assignments]))
    
    result = []
    for module_id in module_ids:
        module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
        if not module:
            continue
        
        project = db.query(Project).filter(Project.id == module.project_id).first()
        
        # ✅ ADD THIS NULL CHECK
        if not project:
            continue  # Skip this module if project doesn't exist
        
        # Count total cases and completed validations
        total_cases = db.query(ValidatorAssignment).filter(
            ValidatorAssignment.module_id == module_id,
            ValidatorAssignment.validator_id == current_user.id
        ).count()
        
        # Get completed validations by counting feedback through assignments
        completed_cases = db.query(ValidationFeedback).join(
            ValidatorAssignment,
            ValidationFeedback.assignment_id == ValidatorAssignment.id
        ).filter(
            ValidatorAssignment.module_id == module_id,
            ValidatorAssignment.validator_id == current_user.id
        ).count()
        
        result.append({
            "module_id": module.id,
            "module_name": module.module_name,
            "module_number": module.module_number,
            "question_text": module.question_text,
            "answer_type": module.answer_type,
            "project_id": project.id,
            "project_name": project.name,
            "project_description": project.description,
            "total_cases": total_cases,
            "completed_cases": completed_cases,
            "progress_percentage": int((completed_cases / total_cases * 100)) if total_cases > 0 else 0
        })
    
    return result


@router.post("/{module_id}/launch")
def launch_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Launch module: Sample cases AND run AI analysis in one step.
    Uses the project's ai_provider setting to determine which AI to use.
    """
    from app.models import (
        Project, CourtCase, ModuleCaseSample, ValidatorAssignment, 
        AIAnalysis, VerificationModule
    )
    import random
    
    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get project to check AI provider
    project = db.query(Project).filter(Project.id == module.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Permission check
    if current_user.role.value == "scholar" and project.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if validator is assigned
    validator_assignment = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id
    ).first()
    
    if not validator_assignment:
        raise HTTPException(
            status_code=400,
            detail="Validator must be assigned before launching module"
        )
    
    # Check if already sampled
    existing_samples = db.query(ModuleCaseSample).filter(
        ModuleCaseSample.module_id == module_id
    ).count()
    
    if existing_samples > 0:
        raise HTTPException(
            status_code=400,
            detail="Module already launched with sampled cases"
        )
    
    # STEP 1: Sample cases
    all_cases = db.query(CourtCase).filter(
        CourtCase.project_id == module.project_id
    ).all()
    
    if len(all_cases) == 0:
        raise HTTPException(status_code=400, detail="No cases available to sample")
    
    sample_size = min(module.sample_size, len(all_cases))
    sampled_cases = random.sample(all_cases, sample_size)
    
    # Create case samples
    for idx, case in enumerate(sampled_cases, start=1):
        sample = ModuleCaseSample(
            module_id=module_id,
            case_id=case.id,
            sample_order=idx
        )
        db.add(sample)
    
    # Update module status
    module.status = "ai_analyzing"
    module.launched_at = datetime.utcnow()
    db.commit()
    
    # STEP 2: Run AI analysis based on project's ai_provider
    # Use module's AI provider first, then project's, then fallback
    ai_provider = module.ai_provider or project.ai_provider or "dummy"

    # DEBUG LINE:
    print(f"DEBUG: ai_provider = {ai_provider}")

    # if ai_provider == "dummy":
    #     # Use mock AI
    #     _run_mock_ai_analysis(module, sampled_cases, db)
    #     ai_used = "Dummy AI (Mock)"
    # elif ai_provider in ["groq-llama-8b", "groq-llama-70b", "groq-llama-405b"]:
    #     # Use Llama via Groq API
    #     _run_groq_ai_analysis(module, sampled_cases, ai_provider, project, db)
    #     model_size = ai_provider.split('-')[2].upper()  # Extracts "8B", "70B", or "405B"
    #     ai_used = f"Llama 3.1 {model_size} (Groq Cloud)"
    # else:
    #     # Fallback to mock
    #     _run_mock_ai_analysis(module, sampled_cases, db)
    #     ai_used = "Dummy AI (Mock - fallback)"

    if ai_provider == "dummy":
        print("DEBUG: Calling _run_mock_ai_analysis (dummy)")
        _run_mock_ai_analysis(module, sampled_cases, db)
        ai_used = "Dummy AI (Mock)"
    elif ai_provider in ["groq-llama-8b", "groq-llama-70b", "groq-llama-405b"]:
        print("DEBUG: Calling _run_groq_ai_analysis")
        _run_groq_ai_analysis(module, sampled_cases, ai_provider, project, db)
        model_size = ai_provider.split('-')[2].upper()
        ai_used = f"Llama 3.3 {model_size} (Groq Cloud)"
    else:
        print(f"DEBUG: Fallback - ai_provider was {ai_provider}")
        _run_mock_ai_analysis(module, sampled_cases, db)
        ai_used = "Dummy AI (Mock - fallback)"

    # STEP 3: Create ValidatorAssignment records for each sampled case
    # Get the validator who was assigned to this module
    validator_assignment = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id
    ).first()

    if validator_assignment:
        validator_id = validator_assignment.validator_id
        
        # Delete the single module-level assignment
        db.delete(validator_assignment)
        
        # Create one assignment per case
        for case in sampled_cases:
            case_assignment = ValidatorAssignment(
                module_id=module_id,
                validator_id=validator_id,
                case_id=case.id
            )
            db.add(case_assignment)

    # Update module status to ready for validation
    module.status = "validation_in_progress"
    db.commit()
    
    return {
        "success": True,
        "message": f"Module launched successfully! {sample_size} cases sampled and analyzed using {ai_used}.",
        "cases_sampled": sample_size,
        "ai_provider": ai_provider,
        "ai_used": ai_used
    }


def _run_mock_ai_analysis(module: VerificationModule, sampled_cases: list, db: Session):
    """Run mock AI analysis (existing logic)"""
    from app.models import AIAnalysis
    import random
    
    # Generate mock responses for each case
    for case in sampled_cases:
        if module.answer_type == "yes_no":
            ai_answer = random.choice(["Yes", "No"])
        elif module.answer_type == "multiple_choice" and module.answer_options:
            ai_answer = random.choice(module.answer_options)
        elif module.answer_type == "integer":
            ai_answer = str(random.randint(1, 100))
        elif module.answer_type == "date":
            ai_answer = f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        else:
            ai_answer = "Mock AI response for text question"
        
        ai_analysis = AIAnalysis(
            module_id=module.id,
            case_id=case.id,
            ai_answer=ai_answer,
            ai_reasoning="Mock reasoning generated by dummy AI",
            ai_confidence=random.uniform(0.7, 0.99),
            ai_round=module.ai_round,
            model_used="dummy-ai-v1",
            tokens_used=random.randint(100, 500),
            cost=0.0
        )
        db.add(ai_analysis)


def _run_groq_ai_analysis(module: VerificationModule, sampled_cases: list, 
                          ai_provider: str, project: Project, db: Session):
    """Run AI analysis using Groq API (cloud-hosted Llama models)"""
    try:
        from app.models import AIAnalysis
        from groq import Groq
        import os
        
        print(f"🔍 DEBUG: Inside _run_groq_ai_analysis with {len(sampled_cases)} cases")
        
        # Map provider names to Groq model names
        model_map = {
            "groq-llama-8b": "llama-3.1-8b-instant",
            "groq-llama-70b": "llama-3.3-70b-versatile",
            "groq-llama-405b": "meta-llama/llama-4-maverick-17b-128e-instruct"
        }
        
        groq_model = model_map.get(ai_provider, "llama-3.3-70b-versatile")
        print(f"🔍 DEBUG: Using Groq model: {groq_model}")
        
        # Initialize Groq client
        api_key = os.getenv("GROQ_API_KEY")
        print(f"🔍 DEBUG: GROQ_API_KEY exists: {bool(api_key)}, length: {len(api_key) if api_key else 0}")
        
        if not api_key:
            print("❌ DEBUG: No API key found - falling back to mock")
            _run_mock_ai_analysis(module, sampled_cases, db)
            return
        
        print(f"🔍 DEBUG: Creating Groq client...")
        client = Groq(api_key=api_key)
        print(f"✅ DEBUG: Groq client created successfully")
        
        # Get project context
        print(f"🔍 DEBUG: Fetching project context...")
        from app.models import ProjectContext
        project_context_obj = db.query(ProjectContext).filter(
            ProjectContext.project_id == project.id
        ).first()
        project_context = project_context_obj.context_text if project_context_obj else None
        print(f"✅ DEBUG: Project context fetched (exists: {bool(project_context)})")
        
        print(f"🔍 DEBUG: Starting loop through {len(sampled_cases)} cases...")
        
        # Process each case
        for case in sampled_cases:
            print(f"🔍 DEBUG: Processing case {case.id}...")
            
            try:
                # Build the prompt
                prompt = _build_llama_prompt(
                    question=module.question_text,
                    case_text=case.opinion_text or "",
                    answer_type=module.answer_type,
                    answer_options=module.answer_options,
                    project_context=project_context,
                    module_context=module.module_context
                )
                
                print(f"🔍 DEBUG: Prompt built, calling Groq API...")
                
                # Call Groq API
                response = client.chat.completions.create(
                    model=groq_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    max_tokens=500
                )
                
                print(f"✅ DEBUG: Got API response for case {case.id}")
                
                # Extract answer and calculate cost
                ai_answer = response.choices[0].message.content.strip()
                tokens_used = response.usage.total_tokens if response.usage else 0
                
                # Cost calculation (approximate Groq pricing)
                if "8b" in ai_provider:
                    cost_per_token = 0.00000027  # $0.27 per million tokens
                else:
                    cost_per_token = 0.00000059  # $0.59 per million tokens for 70B/405B
                
                cost = tokens_used * cost_per_token
                
                # Create AI analysis record
                ai_analysis = AIAnalysis(
                    module_id=module.id,
                    case_id=case.id,
                    ai_answer=ai_answer,
                    ai_reasoning="Generated by Groq Cloud API",
                    ai_confidence=0.85,
                    ai_round=module.ai_round,
                    model_used=groq_model,
                    tokens_used=tokens_used,
                    cost=cost
                )
                db.add(ai_analysis)
                print(f"✅ DEBUG: AI analysis record created for case {case.id}")
                
            except Exception as e:
                # Handle errors for individual cases
                print(f"❌ ERROR processing case {case.id}: {str(e)}")
                print(f"❌ Error type: {type(e).__name__}")
                import traceback
                traceback.print_exc()
                
                # Create error record
                ai_analysis = AIAnalysis(
                    module_id=module.id,
                    case_id=case.id,
                    ai_answer="ERROR",
                    ai_reasoning=f"Groq API error: {str(e)}",
                    ai_confidence=0.0,
                    ai_round=module.ai_round,
                    model_used=groq_model,
                    tokens_used=0,
                    cost=0.0
                )
                db.add(ai_analysis)
        
        # Commit all analyses
        print(f"🔍 DEBUG: Committing {len(sampled_cases)} AI analyses to database...")
        db.commit()
        print(f"✅ DEBUG: All AI analyses committed successfully")
        
    except Exception as e:
        # Handle function-level errors
        print(f"❌ ERROR in _run_groq_ai_analysis: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        print("❌ Falling back to mock AI due to error")
        _run_mock_ai_analysis(module, sampled_cases, db)


def _build_llama_prompt(question: str, case_text: str, answer_type: str, 
                        answer_options: list = None, project_context: str = None,
                        module_context: str = None) -> str:
    """Build a structured prompt for Llama"""
    
    prompt_parts = []
    
    # Add project context if available
    if project_context:
        prompt_parts.append(f"PROJECT CONTEXT:\n{project_context}\n")
    
    # Add module context if available
    if module_context:
        prompt_parts.append(f"MODULE CONTEXT:\n{module_context}\n")
    
    # Add the question
    prompt_parts.append(f"QUESTION:\n{question}\n")
    
    # Add answer format instructions
    if answer_type == "yes_no":
        prompt_parts.append("ANSWER FORMAT: Respond with only 'Yes' or 'No'.\n")
    elif answer_type == "multiple_choice" and answer_options:
        prompt_parts.append(f"ANSWER FORMAT: Choose ONE of these options: {', '.join(answer_options)}\n")
    elif answer_type == "integer":
        prompt_parts.append("ANSWER FORMAT: Respond with a single number.\n")
    elif answer_type == "date":
        prompt_parts.append("ANSWER FORMAT: Respond with a date in YYYY-MM-DD format.\n")
    else:
        prompt_parts.append("ANSWER FORMAT: Provide a brief, direct answer.\n")
    
    # Add the case text (limit to avoid token limits)
    prompt_parts.append(f"COURT OPINION:\n{case_text[:4000]}\n")
    
    # Final instruction
    prompt_parts.append("Based on the court opinion above, answer the question. Provide ONLY the answer, no explanation.")
    
    return "\n".join(prompt_parts)


@router.get("/modules/{module_id}/validation-cases")
def get_validation_cases(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all cases assigned to validator for this module with AI analyses.
    Includes validation status.
    """
    if current_user.role.value != "validator":
        raise HTTPException(status_code=403, detail="Only validators can access this endpoint")
    
    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Verify this validator is assigned to this module
    assignment_check = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id,
        ValidatorAssignment.validator_id == current_user.id
    ).first()
    
    if not assignment_check:
        raise HTTPException(status_code=403, detail="You are not assigned to this module")
    
    # Get all assignments for this validator in this module
    assignments = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id,
        ValidatorAssignment.validator_id == current_user.id
    ).all()
    
    result = []
    for assignment in assignments:
        # Get case
        case = db.query(CourtCase).filter(CourtCase.id == assignment.case_id).first()
        
        # Null Check
        if not case:
            continue  # Skip if case doesn't exist
        
        # Get AI analysis
        ai_analysis = db.query(AIAnalysis).filter(
            AIAnalysis.module_id == module_id,
            AIAnalysis.case_id == assignment.case_id
        ).first()
        
        # Get validation through assignment relationship
        validation = db.query(ValidationFeedback).filter(
            ValidationFeedback.assignment_id == assignment.id
        ).first()
        
        # Get sample order
        sample = db.query(ModuleCaseSample).filter(
            ModuleCaseSample.module_id == module_id,
            ModuleCaseSample.case_id == assignment.case_id
        ).first()
        
        case_data = {
            "case_id": case.id,
            "case_name": case.case_name,
            "court": case.court,
            "case_date": case.case_date,
            "state": case.state,
            "sample_order": sample.sample_order if sample else None,
            # Additional fields validators might want to see
            "docket_number": case.docket_number,
            "judges_names": case.judges_names,
            "election_type": case.election_type,
            "party_who_appointed_judge": case.party_who_appointed_judge,
            "opinion_text": case.opinion_text,
            "dissent_text": case.dissent_text,
            "concur_text": case.concur_text,
        }
        
        if ai_analysis:
            case_data["ai_analysis"] = {
                "ai_answer": ai_analysis.ai_answer,
                "ai_reasoning": ai_analysis.ai_reasoning,
                "ai_confidence": ai_analysis.ai_confidence,
                "model_used": ai_analysis.model_used
            }
        else:
            case_data["ai_analysis"] = None
                
        if validation:
            case_data["validation"] = {
                "is_correct": validation.is_correct,
                "corrected_answer": validation.validator_correction,
                "validator_reasoning": validation.validator_reasoning,
                "validator_notes": validation.validator_notes,
                "validated_at": validation.submitted_at
            }
        else:
            case_data["validation"] = None
        
        result.append(case_data)
    
    # Sort by sample_order
    result.sort(key=lambda x: x["sample_order"] if x["sample_order"] else 999)
    
    return result


@router.post("/validations")
def submit_validation(
    module_id: int,
    case_id: int,
    is_correct: bool,
    corrected_answer: Optional[str] = None,
    validator_reasoning: Optional[str] = None,
    validator_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit or update a validation for a case.
    """
    if current_user.role.value != "validator":
        raise HTTPException(status_code=403, detail="Only validators can submit validations")
    
    # Verify assignment
    assignment = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id,
        ValidatorAssignment.case_id == case_id,
        ValidatorAssignment.validator_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="You are not assigned to validate this case")
    
    # Check if validation already exists for this assignment
    existing = db.query(ValidationFeedback).filter(
        ValidationFeedback.assignment_id == assignment.id
    ).first()

    if existing:
        # Update existing validation
        existing.is_correct = is_correct
        existing.validator_correction = corrected_answer
        existing.validator_reasoning = validator_reasoning
        existing.validator_notes = validator_notes
        existing.submitted_at = func.now()
        db.commit()
        
        return {
            "success": True,
            "message": "Validation updated",
            "validation_id": existing.id
        }

    else:
        # Get AI analysis for this case
        ai_analysis = db.query(AIAnalysis).filter(
            AIAnalysis.module_id == module_id,
            AIAnalysis.case_id == case_id
        ).first()
        
        if not ai_analysis:
            raise HTTPException(status_code=404, detail="AI analysis not found for this case")
        
        # Create new validation
        validation = ValidationFeedback(
            assignment_id=assignment.id,
            ai_analysis_id=ai_analysis.id,
            is_correct=is_correct,
            validator_correction=corrected_answer,
            validator_reasoning=validator_reasoning,
            validator_notes=validator_notes
        )
        db.add(validation)
        db.commit()    
        
        return {
            "success": True,
            "message": "Validation submitted",
            "validation_id": validation.id
        }
    
@router.get("/modules/{module_id}/validation-summary")
def get_validation_summary(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get validation summary for a module.
    Shows AI accuracy, corrections pending, validator info.
    """
    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check permissions (scholar or admin)
    project = db.query(Project).filter(Project.id == module.project_id).first()
    if current_user.role.value == "scholar" and project.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role.value not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all AI analyses for this module
    total_cases = db.query(AIAnalysis).filter(
        AIAnalysis.module_id == module_id
    ).count()
    
    # Get all validations
    validations = db.query(ValidationFeedback).join(
        ValidatorAssignment,
        ValidationFeedback.assignment_id == ValidatorAssignment.id
    ).filter(
        ValidatorAssignment.module_id == module_id
    ).all()
    
    # Count correct/incorrect
    ai_correct = sum(1 for v in validations if v.is_correct)
    ai_incorrect = sum(1 for v in validations if not v.is_correct)
    
    # Get validator info
    validator_assignment = db.query(ValidatorAssignment).filter(
        ValidatorAssignment.module_id == module_id
    ).first()
    
    validator_info = None
    if validator_assignment:
        validator = db.query(User).filter(User.id == validator_assignment.validator_id).first()
        if validator:
            # Calculate validator's past approval rate
            past_validations = db.query(ValidationFeedback).join(
                ValidatorAssignment,
                ValidationFeedback.assignment_id == ValidatorAssignment.id
            ).filter(
                ValidatorAssignment.validator_id == validator.id,
                ValidationFeedback.scholar_reviewed == True
            ).all()
            
            total_past = len(past_validations)
            approved_past = sum(1 for v in past_validations if v.scholar_approved)
            approval_rate = (approved_past / total_past * 100) if total_past > 0 else None
            
            validator_info = {
                "id": validator.id,
                "email": validator.email,
                "full_name": validator.full_name,
                "past_validations": total_past,
                "past_approval_rate": round(approval_rate) if approval_rate else None
            }
    
    # Count corrections by review status
    corrections_pending = sum(1 for v in validations if not v.is_correct and not v.scholar_reviewed)
    corrections_approved = sum(1 for v in validations if not v.is_correct and v.scholar_reviewed and v.scholar_approved)
    corrections_rejected = sum(1 for v in validations if not v.is_correct and v.scholar_reviewed and not v.scholar_approved)
    
    return {
        "module_id": module_id,
        "module_name": module.module_name,
        "question_text": module.question_text,
        "answer_type": module.answer_type,
        "total_cases": total_cases,
        "ai_correct": ai_correct,
        "ai_incorrect": ai_incorrect,
        "ai_accuracy_percentage": round((ai_correct / total_cases * 100)) if total_cases > 0 else 0,
        "validator": validator_info,
        "corrections_pending": corrections_pending,
        "corrections_approved": corrections_approved,
        "corrections_rejected": corrections_rejected,
        "total_corrections": ai_incorrect
    }


@router.get("/modules/{module_id}/corrections")
def get_corrections_for_review(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all validator corrections for scholar to review.
    Only returns cases where validator marked AI as incorrect.
    """
    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check permissions
    project = db.query(Project).filter(Project.id == module.project_id).first()
    if current_user.role.value == "scholar" and project.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role.value not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all incorrect validations (corrections) that haven't been reviewed yet
    validations = db.query(ValidationFeedback).join(
        ValidatorAssignment,
        ValidationFeedback.assignment_id == ValidatorAssignment.id
    ).filter(
        ValidatorAssignment.module_id == module_id,
        ValidationFeedback.is_correct == False,  # Only corrections
        ValidationFeedback.scholar_reviewed == False  # ← Add this line: Only pending
    ).all()
    
    result = []
    for validation in validations:
        # Get case
        assignment = db.query(ValidatorAssignment).filter(
            ValidatorAssignment.id == validation.assignment_id
        ).first()
        
        case = db.query(CourtCase).filter(CourtCase.id == assignment.case_id).first()
        
        # Get AI analysis
        ai_analysis = db.query(AIAnalysis).filter(
            AIAnalysis.module_id == module_id,
            AIAnalysis.case_id == assignment.case_id
        ).first()
        
        # Get validator
        validator = db.query(User).filter(User.id == assignment.validator_id).first()
        
        result.append({
            "validation_id": validation.id,
            "case_id": case.id,
            "case_name": case.case_name,
            "court": case.court,
            "case_date": str(case.case_date) if case.case_date else None,
            "state": case.state,
            "ai_answer": ai_analysis.ai_answer if ai_analysis else None,
            "ai_reasoning": ai_analysis.ai_reasoning if ai_analysis else None,
            "ai_confidence": ai_analysis.ai_confidence if ai_analysis else None,
            "validator_correction": validation.validator_correction,
            "validator_reasoning": validation.validator_reasoning,
            "validator_notes": validation.validator_notes,
            "validator_email": validator.email if validator else None,
            "scholar_reviewed": validation.scholar_reviewed,
            "scholar_approved": validation.scholar_approved,
            "scholar_notes": validation.scholar_notes
        })
    
    return result


@router.post("/modules/{module_id}/review-correction")
def review_correction(
    module_id: int,
    request: ReviewCorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scholar approves or rejects a validator's correction.
    If approved, adds to feedback library for Round 2.
    """
    validation_id = request.validation_id
    approve = request.approve
    scholar_notes = request.scholar_notes

    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check permissions
    project = db.query(Project).filter(Project.id == module.project_id).first()
    if current_user.role.value == "scholar" and project.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role.value not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get validation
    validation = db.query(ValidationFeedback).filter(
        ValidationFeedback.id == validation_id
    ).first()
    
    if not validation:
        raise HTTPException(status_code=404, detail="Validation not found")
    
    # Update validation with scholar review
    validation.scholar_reviewed = True
    validation.scholar_approved = approve
    validation.scholar_notes = scholar_notes
    validation.reviewed_at = func.now()
    
    # If approved, add to feedback library
    if approve:
        # Get assignment and AI analysis for context
        assignment = db.query(ValidatorAssignment).filter(
            ValidatorAssignment.id == validation.assignment_id
        ).first()
        
        ai_analysis = db.query(AIAnalysis).filter(
            AIAnalysis.module_id == module_id,
            AIAnalysis.case_id == assignment.case_id
        ).first()
        
        # Check if already in feedback library (check by case + module)
        existing_feedback = db.query(FeedbackLibrary).filter(
            FeedbackLibrary.module_id == module_id,
            FeedbackLibrary.example_case_id == assignment.case_id
        ).first()
        
        if not existing_feedback:
            # Create feedback library entry with correct field names
            feedback = FeedbackLibrary(
                module_id=module_id,
                question_text=module.question_text,
                wrong_answer=ai_analysis.ai_answer if ai_analysis else None,
                correct_answer=validation.validator_correction,
                correction_reason=validation.validator_reasoning,
                example_case_id=assignment.case_id,
                helped_improve=None  # Will be evaluated in Round 2
            )
            db.add(feedback)
 
    return {
        "success": True,
        "validation_id": validation_id,
        "approved": approve,
        "added_to_feedback_library": approve
    }


@router.post("/modules/{module_id}/trust-validator")
def trust_validator_bulk_approve(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scholar trusts validator - bulk approve all pending corrections.
    """
    # Get module
    module = db.query(VerificationModule).filter(VerificationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check permissions
    project = db.query(Project).filter(Project.id == module.project_id).first()
    if current_user.role.value == "scholar" and project.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role.value not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all unreviewed corrections
    validations = db.query(ValidationFeedback).join(
        ValidatorAssignment,
        ValidationFeedback.assignment_id == ValidatorAssignment.id
    ).filter(
        ValidatorAssignment.module_id == module_id,
        ValidationFeedback.is_correct == False,
        ValidationFeedback.scholar_reviewed == False
    ).all()
    
    count = 0
    from app.models import FeedbackLibrary
    
    for validation in validations:
        # Mark as reviewed and approved
        validation.scholar_reviewed = True
        validation.scholar_approved = True
        validation.scholar_notes = "Auto-approved via Trust Validator"
        validation.reviewed_at = func.now()
        
        # Add to feedback library
        assignment = db.query(ValidatorAssignment).filter(
            ValidatorAssignment.id == validation.assignment_id
        ).first()
        
        ai_analysis = db.query(AIAnalysis).filter(
            AIAnalysis.module_id == module_id,
            AIAnalysis.case_id == assignment.case_id
        ).first()
        
        feedback = FeedbackLibrary(
            module_id=module_id,
            question_text=module.question_text,
            wrong_answer=ai_analysis.ai_answer if ai_analysis else None,
            correct_answer=validation.validator_correction,
            correction_reason=validation.validator_reasoning,
            example_case_id=assignment.case_id,
            helped_improve=None
        )
        db.add(feedback)
        count += 1
    
    db.commit()
    
    return {
        "success": True,
        "approved_count": count,
        "message": f"Bulk approved {count} corrections"
    }