from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routes.verify import router as verify_router
from app.routes.universal_check import router as universal_router

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")

if ALLOWED_ORIGINS:
    allowed_origins = [o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()]
else:
    allowed_origins = ["*"]  # fallback for local dev

app = FastAPI(title="Reality Check API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": allowed_origins,
    }


# IMPORTANT: mount routers under /api
app.include_router(verify_router, prefix="/api")
app.include_router(universal_router, prefix="/api")

