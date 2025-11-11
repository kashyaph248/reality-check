from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.verify import router as verify_router
from app.routes.universal_check import router as universal_router

# ---------------------------------------------------------
# Initialize FastAPI App
# ---------------------------------------------------------
app = FastAPI(
    title="Reality Check API",
    description="Backend for Reality Check — Fact Verification & Media Analysis",
    version="1.0.0"
)

# ---------------------------------------------------------
# Allowed Origins (Frontend + Local Dev + Backend)
# ---------------------------------------------------------
origins = [
    "http://localhost:3000",
    "https://reality-check-v1d6.vercel.app",
    "https://reality-check-oh5g.onrender.com"
]

# ---------------------------------------------------------
# Configure CORS Middleware
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Whitelist origins
    allow_credentials=True,
    allow_methods=["*"],            # Allow all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],            # Allow all custom headers
)

# ---------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------
@app.get("/api/health")
async def health_check():
    """
    Simple health check endpoint for debugging and Render monitoring.
    """
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": origins
    }

# ---------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------
@app.get("/")
async def root():
    """
    Root endpoint — helpful to confirm app deployment.
    """
    return {
        "message": "Welcome to Reality Check API 🚀",
        "docs": "/docs",
        "health": "/api/health"
    }

# ---------------------------------------------------------
# Include API Routers
# ---------------------------------------------------------
app.include_router(verify_router, prefix="/api", tags=["verify"])
app.include_router(universal_router, prefix="/api", tags=["universal"])

# ---------------------------------------------------------
# Run Info (if run locally)
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

