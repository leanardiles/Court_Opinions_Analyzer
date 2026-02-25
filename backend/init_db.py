"""
Database initialization script.

This script creates all database tables based on your models.
Run this once to set up your database, or whenever you want to reset it.

Usage:
    python init_db.py
"""

from app.database import engine, Base
from app.models import User, Project, CourtCase, Assignment, Verification  # Import ALL models

def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created successfully!")
    print("[OK] Database file: database.db")
    print("\nTables created:")
    print("  - users")
    print("  - projects")
    print("  - court_cases")
    print("  - assignments")
    print("  - verifications")
    
def drop_db():
    """Drop all database tables (use with caution!)"""
    print("WARNING: Dropping all tables...")
    response = input("Are you sure? This will delete all data (y/n): ")
    if response.lower() == 'y':
        Base.metadata.drop_all(bind=engine)
        print("[OK] All tables dropped")
    else:
        print("[X] Cancelled")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--drop":
        drop_db()
    else:
        init_db()