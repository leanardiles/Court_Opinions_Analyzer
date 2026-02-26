"""
Dependencies for FastAPI routes.

Provides reusable dependencies for authentication and authorization.
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole
from app.routers.auth import get_current_user


def require_role(required_role: UserRole):
    """
    Dependency factory to check if user has required role.
    
    Usage:
        @router.post("/admin-only")
        def admin_endpoint(user: User = Depends(require_role(UserRole.ADMIN))):
            return {"message": "Admin only!"}
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role.value}"
            )
        return current_user
    return role_checker


def require_admin(current_user: User = Depends(get_current_user)):
    """
    Dependency to ensure current user is an admin.
    
    Usage:
        @router.post("/projects")
        def create_project(admin: User = Depends(require_admin)):
            # Only admins can access this
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_scholar(current_user: User = Depends(get_current_user)):
    """Dependency to ensure current user is a scholar."""
    if current_user.role != UserRole.SCHOLAR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Scholar access required"
        )
    return current_user


def require_validator(current_user: User = Depends(get_current_user)):
    """Dependency to ensure current user is a validator."""
    if current_user.role != UserRole.VALIDATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Validator access required"
        )
    return current_user