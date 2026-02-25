"""
Application configuration settings.

This file manages environment variables and application settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Create a .env file in backend/ folder with:
        SECRET_KEY=your-secret-key-min-32-characters-long
        ALGORITHM=HS256
        ACCESS_TOKEN_EXPIRE_MINUTES=30
    """
    
    # JWT Settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite:///./database.db"
    
    # Application
    APP_NAME: str = "Court Opinions Analyzer"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create global settings instance
settings = Settings()