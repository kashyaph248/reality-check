from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Allowed origins (frontend + local)
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

app = FastAPI(title="Reality Check API")

# -------------- CORS --------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------- BASIC ROUTES --------------
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

# -------------- VERIFY + UNIVERSAL CHECK --------------
@app.api_route("/api/verify", methods=["GET", "POST", "OPTIONS"])
async def verify(request: Request):
    """
    Accepts both GET and POST.
    Reads any JSON payload from frontend and echoes it back.
    """
    try:
        data = await request.json()
    except Exception:
        data = {}

    return {
        "status": "ok",
        "endpoint": "verify",
        "received": data,
        "note": "Verify route is alive and accepting requests ✅",
    }


@app.api_route("/api/universal-check", methods=["GET", "POST", "OPTIONS"])
async def universal_check(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    return {
        "status": "ok",
        "endpoint": "universal-check",
        "received": data,
        "note": "Universal Check route is alive and accepting requests ✅",
    }

