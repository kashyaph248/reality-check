import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.verify import router as verify_router
from app.routes.universal_check import router as universal_router

# Load .env locally; on Render it reads real env vars
load_dotenv(override=True)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

allowed_origins_list = [
    o.strip()
    for o in ALLOWED_ORIGINS.split(",")
    if o.strip()
]

app = FastAPI(
    title="Reality Check API",
    version="1.0.0",
    description="Backend for Reality Check: claim, media, and universal verification.",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Meta / Health ---

@app.get("/", tags=["meta"])
async def root():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "docs": "/docs",
        "health": "/api/health",
    }

@app.get("/api/health", tags=["meta"])
async def health():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": allowed_origins_list,
    }

# --- Routers ---

# /api/verify  (see app/routes/verify.py)
app.include_router(verify_router, prefix="/api", tags=["verify"])

# /api/universal-check  (see app/routes/universal_check.py)
app.include_router(universal_router, prefix="/api", tags=["universal-check"])

