# app/main.py

import os
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables (.env locally, Render env in production)
load_dotenv()

# ---- Allowed origins -------------------------------------------------------

raw_origins = os.getenv("ALLOWED_ORIGINS", "")

# Expected format in Render:
# ALLOWED_ORIGINS=http://localhost:3000,https://reality-check-v1d6.vercel.app,https://reality-check-oh5g.onrender.com
def parse_allowed_origins(value: str) -> List[str]:
    parts = [p.strip() for p in value.split(",") if p.strip()]
    # absolutely no "ALLOWED_ORIGINS=" prefix leakage
    cleaned: List[str] = []
    for p in parts:
        if p.startswith("ALLOWED_ORIGINS="):
            p = p.split("=", 1)[1].strip()
        if p:
            cleaned.append(p)
    return cleaned


ALLOWED_ORIGINS: List[str] = parse_allowed_origins(raw_origins)

# ---- Routers ---------------------------------------------------------------

from app.routes.verify import router as verify_router  # noqa: E402
from app.routes.universal_check import router as universal_router  # noqa: E402

# ---- App -------------------------------------------------------------------

app = FastAPI(
    title="Reality Check API",
    version="1.0.0",
    description="Backend for Reality Check claim & media verification."
)

# CORS for Vercel + localhost + Render backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(verify_router)
app.include_router(universal_router)

# ---- Health & config endpoints --------------------------------------------


@app.get("/")
async def root():
    return {
        "message": "Welcome to Reality Check API 🚀",
        "docs": "/docs",
        "health": "/api/health",
        "config": "/api/config",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": ALLOWED_ORIGINS,
    }


@app.get("/api/config")
async def config():
    # Frontend uses this to confirm it can talk to the backend
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": ALLOWED_ORIGINS,
    }

