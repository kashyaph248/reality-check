from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Comma-separated list in Render/Vercel:
# ALLOWED_ORIGINS=http://localhost:3000,https://reality-check-v1d6.vercel.app
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

app = FastAPI(title="Reality Check API")


# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],  # fallback for debugging
    allow_credentials=True,
    allow_methods=["*"],                     # allow GET/POST/OPTIONS etc
    allow_headers=["*"],
)


# ---------------- ROOT & HEALTH ----------------
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


# ---------------- VERIFY (Quick Check) ----------------
# Accept BOTH GET and POST so browser tests & frontend both work.
from fastapi import Body

@app.api_route("/api/verify", methods=["GET", "POST", "OPTIONS"])
async def verify_endpoint(
    claim: str = Body("", embed=True),
    url: str = Body("", embed=True),
):
    """
    Temporary implementation:
    - GET: simple 'ok' so you can hit it in the browser.
    - POST: echo back that backend is wired.
    Frontend should use POST.
    """
    # If it's a preflight OPTIONS, CORSMiddleware will handle it before here.
    return {
        "status": "ok",
        "endpoint": "verify",
        "received": {
            "claim": claim,
            "url": url,
        },
    }


# ---------------- UNIVERSAL CHECK (Deep/Universal) ----------------
@app.api_route("/api/universal-check", methods=["GET", "POST", "OPTIONS"])
async def universal_check_endpoint(
    claim: str = Body("", embed=True),
    url: str = Body("", embed=True),
):
    return {
        "status": "ok",
        "endpoint": "universal-check",
        "received": {
            "claim": claim,
            "url": url,
        },
    }

