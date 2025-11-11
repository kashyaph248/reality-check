import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables (locally or from Render dashboard)
load_dotenv()

# Read allowed origins from .env or fallback to local + vercel
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV:
    ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_ENV.split(",") if o.strip()]
else:
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "https://reality-check-v1d6.vercel.app",
    ]

app = FastAPI(title="Reality Check API", version="1.0.0")

# ✅ Fix CORS here
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.routes.verify import router as verify_router
from app.routes.universal_check import router as universal_router

app.include_router(verify_router, prefix="/api", tags=["verify"])
app.include_router(universal_router, prefix="/api", tags=["universal"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Reality Check API 🚀",
        "docs": "/docs",
        "health": "/api/health",
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/config")
async def config():
    return {
        "status": "ok",
        "service": "Reality Check API",
        "allowed_origins": ALLOWED_ORIGINS,
    }

