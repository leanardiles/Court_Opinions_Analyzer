"""
File upload routes - handle Parquet file uploads and parsing.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
from typing import List

from app.database import get_db
from app.models import User, Project, CourtCase
from app.schemas import UploadSummary
from app.dependencies import require_admin
from app.utils.parquet_parser import parse_parquet_file, get_parquet_info

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/projects/{project_id}/parquet", response_model=UploadSummary)
async def upload_parquet(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Upload a Parquet file and import court cases into a project.
    
    Steps:
    1. Verify project exists and user has access
    2. Save uploaded file
    3. Parse Parquet file
    4. Bulk insert court cases into database
    5. Update project metadata
    6. Return summary
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Verify file is Parquet
    if not file.filename.endswith('.parquet'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a .parquet file"
        )
    
    # Save uploaded file
    file_path = UPLOAD_DIR / f"project_{project_id}_{file.filename}"
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Get file info
    file_info = get_parquet_info(str(file_path))
    if not file_info["success"]:
        file_path.unlink()  # Delete file
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Parquet file: {file_info['error']}"
        )
    
    # Parse Parquet file
    parse_result = parse_parquet_file(str(file_path))
    
    if not parse_result["success"]:
        file_path.unlink()  # Delete file
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse Parquet: {', '.join(parse_result['errors'])}"
        )
    
    # Bulk insert court cases
    cases_imported = 0
    errors = parse_result["errors"].copy()
    
    try:
        for case_data in parse_result["cases"]:
            try:
                court_case = CourtCase(
                    project_id=project_id,
                    **case_data
                )
                db.add(court_case)
                cases_imported += 1
            except Exception as e:
                errors.append(f"Failed to import case '{case_data.get('case_name', 'unknown')}': {str(e)}")
        
        # Commit all cases
        db.commit()
        
        # Update project metadata
        project.parquet_filename = file.filename
        project.parquet_filepath = str(file_path)
        project.total_cases = cases_imported
        db.commit()
        
    except Exception as e:
        db.rollback()
        file_path.unlink()  # Delete file
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    
    return UploadSummary(
        success=True,
        project_id=project_id,
        filename=file.filename,
        total_rows=parse_result["total_rows"],
        cases_imported=cases_imported,
        errors=errors,
        file_size_mb=file_info["file_size_mb"]
    )


@router.get("/projects/{project_id}/cases-count")
def get_cases_count(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get count of cases in a project.
    """
    count = db.query(CourtCase).filter(CourtCase.project_id == project_id).count()
    return {"project_id": project_id, "total_cases": count}