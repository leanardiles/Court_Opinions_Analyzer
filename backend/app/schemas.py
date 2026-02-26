from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional

# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr

class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role: str = Field(..., pattern="^(admin|scholar|validator)$", description="User role")

class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)

class UserResponse(UserBase):
    """Schema for user responses (excludes password)"""
    id: int
    role: str
    created_at: datetime
    
    # Pydantic V2 configuration
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

# ============================================================================
# TOKEN SCHEMAS (for authentication)
# ============================================================================

class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Data stored in JWT token"""
    email: Optional[str] = None
    role: Optional[str] = None

# ============================================================================
# PROJECT SCHEMAS
# ============================================================================

class ProjectBase(BaseModel):
    """Base project schema"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    """Schema for creating a project"""
    scholar_id: Optional[int] = None

class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scholar_id: Optional[int] = None
    is_active: Optional[bool] = None

class ProjectResponse(ProjectBase):
    """Schema for project responses"""
    id: int
    admin_id: int
    scholar_id: Optional[int]
    total_cases: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Pydantic V2 configuration
    model_config = ConfigDict(from_attributes=True)