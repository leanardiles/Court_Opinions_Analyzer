from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, projects, uploads, modules

app = FastAPI(
    title="Court Opinions Analyzer API",
    description="API for AI-powered legal corpus analysis with human verification",
    version="1.0.0"
)

# ============================================================================
# CORS Configuration
# ============================================================================

# Allow frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# ROUTES
# ============================================================================

# Include authentication routes
app.include_router(auth.router)

# Include project management routes
app.include_router(projects.router)

# Include file upload routes
app.include_router(uploads.router)

# Register routers
app.include_router(modules.router)

# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "message": "Court Opinions Analyzer API",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected"
    }