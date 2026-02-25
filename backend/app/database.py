from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite connection (a file)
# This will create database.db in the backend/ folder
DATABASE_URL = "sqlite:///./database.db"

# Create engine with check_same_thread=False for SQLite
# This is needed because FastAPI can access SQLite from different threads
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# Session factory
# autocommit=False and autoflush=False are recommended settings
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()

# Dependency function to get database session in FastAPI routes
def get_db():
    """
    Creates a new database session for each request.
    Automatically closes the session when the request is done.
    
    Usage in FastAPI:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()