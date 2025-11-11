from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.verify import router as verify_router
from app.routes.universal_check import router as universal_router
import os

# ✅ Create FastAPI app
app = FastAPI(
    title="Reality Check API",
    description="Backend API for AI-assisted fact verification and media analysis",
    version="1.0.0"
)

# ✅ Allowed origins (frontend + local dev)
origins = [
    "http://localhost:3000",
    "https://reality-check-v1d6.vercel.app"
]

# ✅ Apply CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include API routes
app.include_router(verify_router, prefix="/api")
app.include_router(universal_router, prefix="/api")

# ✅ Health check route for Render monitoring
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": origins
    }

# ✅ Root route (optional)
@app.get("/")
async def root():
    return {
        "message": "Welcome to Reality Check API 🚀",
        "docs": "/docs",
        "health": "/api/health"
    }

