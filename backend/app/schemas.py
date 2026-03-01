from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

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
    admin_email: Optional[str] = None
    scholar_id: Optional[int] = None
    scholar_email: Optional[str] = None
    parquet_filename: Optional[str] = None
    parquet_filepath: Optional[str] = None
    total_cases: int = 0
    
    # Project lifecycle
    status: str = "draft"  # "draft", "ready", "active", "launched"
    sent_to_scholar_at: Optional[datetime] = None
    launched_at: Optional[datetime] = None
    
    # AI Configuration (DUMMY FEATURE FOR NOW)
    ai_model: str = "Sonnet 4.5"
    total_tokens_used: int = 0
    total_cost: float = 0.0
    budget_limit: float = 1000.0

    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Pydantic V2 configuration
    model_config = ConfigDict(from_attributes=True)

# ============================================================================
# UPLOAD SCHEMAS
# ============================================================================

class UploadSummary(BaseModel):
    """Response after uploading and parsing Parquet file"""
    success: bool
    project_id: int
    filename: str
    total_rows: int
    cases_imported: int
    errors: List[str] = []
    file_size_mb: float

# ============================================================================
# PROJECT CONTEXT SCHEMAS
# ============================================================================

class ProjectContextCreate(BaseModel):
    """Schema for creating project context"""
    context_text: str = Field(..., min_length=1)

class ProjectContextResponse(BaseModel):
    """Schema for project context responses"""
    id: int
    project_id: int
    context_text: str
    created_by: int
    version: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# ============================================================================
# VERIFICATION MODULE SCHEMAS
# ============================================================================

class VerificationModuleCreate(BaseModel):
    """Schema for creating a verification module"""
    module_name: str = Field(..., min_length=1, max_length=200)
    question_text: str = Field(..., min_length=1)
    answer_type: str = Field(..., pattern="^(yes_no|multiple_choice|integer|text|date)$")
    answer_options: Optional[List[str]] = None  # Required if answer_type is "multiple_choice"
    module_context: Optional[str] = None
    sample_size: int = Field(..., gt=0, le=1000)  # Between 1 and 1000

class VerificationModuleUpdate(BaseModel):
    """Schema for updating a verification module"""
    module_name: Optional[str] = Field(None, min_length=1, max_length=200)
    question_text: Optional[str] = Field(None, min_length=1)
    answer_type: Optional[str] = Field(None, pattern="^(yes_no|multiple_choice|integer|text|date)$")
    answer_options: Optional[List[str]] = None
    module_context: Optional[str] = None
    sample_size: Optional[int] = Field(None, gt=0, le=1000)

class VerificationModuleResponse(BaseModel):
    """Schema for verification module responses"""
    id: int
    project_id: int
    module_number: int
    module_name: str
    question_text: str
    answer_type: str
    answer_options: Optional[List[str]] = None
    module_context: Optional[str] = None
    sample_size: int
    status: str
    ai_round: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    launched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)