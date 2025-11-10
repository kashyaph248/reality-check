import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.verify import router as verify_router
from app.routes.universal_check import router as universal_router


def get_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "")
    if not raw:
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(title="Reality Check API")

# CORS
allowed_origins = get_allowed_origins()
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


# IMPORTANT: All API routes live under /api
app.include_router(verify_router, prefix="/api", tags=["verify"])
app.include_router(universal_router, prefix="/api", tags=["universal"])

