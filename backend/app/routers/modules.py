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
    from app.utils.ai_service import AIService
    
    return {
        "providers": [
            {"value": key, "label": label}
            for key, label in AIService.PROVIDERS.items()
        ],
        "default": "ollama-8b"
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
    from app.utils.ai_service import AIService
    
    if module_data.ai_provider not in AIService.PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid AI provider. Must be one of: {list(AIService.PROVIDERS.keys())}"
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