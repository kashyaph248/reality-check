from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv(override=True)


def get_allowed_origins() -> list[str]:
    """
    Reads ALLOWED_ORIGINS from .env (comma-separated).
    Defaults to localhost:3000 for development.
    """
    raw = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not raw:
        return ["http://localhost:3000"]
    return [o.strip() for o in raw.split(",") if o.strip()]


# Initialize FastAPI app
app = FastAPI(
    title="Reality Check API",
    version="1.0.0",
    description="Backend for Reality Check: claim verification & media analysis",
)

# CORS configuration
allowed_origins = get_allowed_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.routes.verify import router as verify_router  # noqa: E402
from app.routes.universal_check import router as universal_router  # noqa: E402

app.include_router(verify_router, prefix="/api", tags=["verify"])
app.include_router(universal_router, prefix="/api", tags=["universal"])


# Health check route
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "allowed_origins": get_allowed_origins(),
    }

