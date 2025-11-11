# app/main.py

import os
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Parse ALLOWED_ORIGINS properly from .env or Render Environment
def parse_allowed_origins(raw: str) -> List[str]:
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    cleaned = []
    for p in parts:
        if p.startswith("ALLOWED_ORIGINS="):
            p = p.split("=", 1)[1].strip()
        if p:
            cleaned.append(p)
    return cleaned


ALLOWED_ORIGINS = parse_allowed_origins(
    os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,https://reality-check-v1d6.vercel.app,https://reality-check-oh5g.onrender.com"
    )
)

# Import routes after FastAPI setup
from app.routes.verify import router as verify_router  # noqa
from app.routes.universal_check import router as universal_router  # noqa

app = FastAPI(
    title="Reality Check API",
    description="AI-assisted verification backend for Reality Check",
    version="1.0.0"
)

# CORS Middleware (to allow frontend requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(verify_router)
app.include_router(universal_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Reality Check API 🚀",
        "docs": "/docs",
        "health": "/api/health",
        "config": "/api/config"
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": ALLOWED_ORIGINS
    }


@app.get("/api/config")
async def config():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": ALLOWED_ORIGINS
    }

