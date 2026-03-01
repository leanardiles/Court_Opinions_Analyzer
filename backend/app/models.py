from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

# ============================================================================
# ENUMS
# ============================================================================

class UserRole(str, enum.Enum):
    """User role types for the application"""
    ADMIN = "admin"
    SCHOLAR = "scholar"
    VALIDATOR = "validator"

class AssignmentStatus(str, enum.Enum):
    """Status of case assignments"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"

# ============================================================================
# MODELS
# ============================================================================

class User(Base):
    """
    User model for authentication and authorization.
    
    Roles:
    - admin: Can create projects, upload data, assign users
    - scholar: Can view project results and validator work
    - validator: Can verify AI-generated answers for assigned cases
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_projects = relationship("Project", back_populates="admin", foreign_keys="Project.admin_id")
    scholar_projects = relationship("Project", back_populates="scholar", foreign_keys="Project.scholar_id")
    assignments = relationship("Assignment", back_populates="validator")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class Project(Base):
    """
    Project model - represents a research project analyzing court cases.
    
    Each project:
    - Created by an admin
    - Assigned to one scholar (who reviews validator work)
    - Contains multiple court cases
    - Has multiple validators assigned
    """
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Foreign Keys
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scholar_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Metadata about the uploaded Parquet file
    parquet_filename = Column(String, nullable=True)  # Original filename
    parquet_filepath = Column(String, nullable=True)  # Where it's stored
    total_cases = Column(Integer, default=0)  # Number of cases in the project
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    admin = relationship("User", back_populates="created_projects", foreign_keys=[admin_id])
    scholar = relationship("User", back_populates="scholar_projects", foreign_keys=[scholar_id])
    court_cases = relationship("CourtCase", back_populates="project", cascade="all, delete-orphan")

    # Project lifecycle
    status = Column(String, default="draft")  # "draft", "ready", "active", "launched"
    sent_to_scholar_at = Column(DateTime)  # When admin sent to scholar
    launched_at = Column(DateTime)  # When scholar launched
    
    is_active = Column(Boolean, default=True)  # Keep for archiving/deleting
    
    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name}, admin_id={self.admin_id})>"


class CourtCase(Base):
    """
    Court case model - individual cases from the uploaded Parquet file.
    
    This table stores the subset of Parquet data needed for the verification workflow.
    Each case belongs to one project and can have multiple assignments.
    """
    __tablename__ = "court_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Case information (from Parquet file)
    case_name = Column(String, nullable=False, index=True)
    case_date = Column(DateTime, nullable=True)
    court = Column(String, nullable=True)
    docket_number = Column(String, nullable=True)
    
    # Judges (stored as JSON array since it can be multiple judges)
    judges_names = Column(JSON, nullable=True)  # e.g., ["Smith, J.", "Jones, J."]
    
    # Opinion text (the main content validators will review)
    opinion_text = Column(Text, nullable=True)
    dissent_text = Column(Text, nullable=True)
    concur_text = Column(Text, nullable=True)
    
    # Additional metadata
    state = Column(String, nullable=True)
    election_type = Column(String, nullable=True)
    party_who_appointed_judge = Column(String, nullable=True)
    
    # AI-generated analysis (stored as JSON)
    # This will contain the AI's answers to the 9 questions
    ai_analysis = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="court_cases")
    assignments = relationship("Assignment", back_populates="court_case", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CourtCase(id={self.id}, case_name={self.case_name}, project_id={self.project_id})>"


class Assignment(Base):
    """
    Assignment model - links validators to specific court cases.
    
    This table manages the workflow:
    - Admin assigns cases to validators
    - Validators work on their assigned cases
    - Status tracks progress
    """
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    court_case_id = Column(Integer, ForeignKey("court_cases.id"), nullable=False)
    validator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Assignment metadata
    status = Column(SQLEnum(AssignmentStatus), default=AssignmentStatus.PENDING, nullable=False)
    priority = Column(Integer, default=0)  # For load balancing or urgent cases
    notes = Column(Text, nullable=True)  # Admin notes to validator
    
    # Timestamps
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)  # When validator opens it
    completed_at = Column(DateTime(timezone=True), nullable=True)  # When submitted
    
    # Relationships
    court_case = relationship("CourtCase", back_populates="assignments")
    validator = relationship("User", back_populates="assignments")
    verification = relationship("Verification", back_populates="assignment", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Assignment(id={self.id}, case_id={self.court_case_id}, validator_id={self.validator_id}, status={self.status})>"


class Verification(Base):
    """
    Verification model - stores validator's verification of AI analysis.
    
    This is where validators confirm or correct the AI's answers to the 9 questions.
    Contains both the validator's answers and comparison with AI.
    """
    __tablename__ = "verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key (one-to-one with Assignment)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False, unique=True)
    
    # Validator's answers (stored as JSON)
    # Structure: {
    #   "question_1": {"answer": "yes", "correct": true, "notes": "..."},
    #   "question_2": {"answer": "no", "correct": false, "notes": "AI said yes but..."},
    #   ...
    # }
    validator_answers = Column(JSON, nullable=False)
    
    # Summary metrics
    total_questions = Column(Integer, default=9)  # How many questions were verified
    ai_correct_count = Column(Integer, default=0)  # How many AI got right
    accuracy_percentage = Column(Integer, default=0)  # ai_correct_count / total_questions * 100
    
    # Validator notes
    general_notes = Column(Text, nullable=True)  # Overall comments about the case
    
    # Scholar review
    reviewed_by_scholar = Column(Boolean, default=False)
    scholar_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    assignment = relationship("Assignment", back_populates="verification")
    
    def __repr__(self):
        return f"<Verification(id={self.id}, assignment_id={self.assignment_id}, accuracy={self.accuracy_percentage}%)>"