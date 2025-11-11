import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from app.routes.verify import router as verify_router
from app.routes.universal_check import router as universal_router

# -----------------------------------------------------------------------------
# CORS / config
# -----------------------------------------------------------------------------

# Read comma-separated origins from env on Render:
# ALLOWED_ORIGINS=http://localhost:3000,https://reality-check-v1d6.vercel.app,https://reality-check-oh5g.onrender.com
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in ALLOWED_ORIGINS_RAW.split(",")
    if origin.strip()
]

app = FastAPI(
    title="Reality Check API",
    version="1.0.0",
    description="Backend for Reality Check fact-checking UI.",
)

# Log what we picked up (helpful on Render)
print("=== Loaded ALLOWED_ORIGINS ===", ALLOWED_ORIGINS or "[none set]")


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or [
        # Fallbacks (only used if env isn't set correctly)
        "http://localhost:3000",
        "https://reality-check-v1d6.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Core endpoints
# -----------------------------------------------------------------------------


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
    """
    Simple config endpoint the frontend can call to confirm connectivity
    and see which origins are allowed.
    """
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": ALLOWED_ORIGINS,
    }


# -----------------------------------------------------------------------------
# Routers
# -----------------------------------------------------------------------------

# These expect:
# - POST /api/verify
# - POST /api/universal-check
app.include_router(verify_router, prefix="/api", tags=["verify"])
app.include_router(universal_router, prefix="/api", tags=["universal-check"])

