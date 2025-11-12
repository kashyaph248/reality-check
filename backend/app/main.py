import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()


def get_allowed_origins() -> List[str]:
    """
    Read ALLOWED_ORIGINS from env as a comma-separated list.
    Fallbacks:
      - if not set: only localhost:3000
    """
    raw = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not raw:
        return ["http://localhost:3000"]

    # Support both "a,b,c" and accidental "ALLOWED_ORIGINS=..." prefix
    if raw.startswith("ALLOWED_ORIGINS="):
        raw = raw.split("=", 1)[1]

    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or ["http://localhost:3000"]


app = FastAPI(
    title="Reality Check API",
    description="Backend for Reality Check claim & media verification.",
    version="1.0.0",
)

ALLOWED_ORIGINS = get_allowed_origins()

# CORS (needed for Vercel + Render + localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.routes.verify import router as verify_router  # noqa: E402
from app.routes.universal_check import router as universal_router  # noqa: E402

app.include_router(verify_router)
app.include_router(universal_router)


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
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": ALLOWED_ORIGINS,
    }

