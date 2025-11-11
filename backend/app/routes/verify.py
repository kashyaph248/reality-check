from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class VerifyRequest(BaseModel):
    """
    Request body for /api/verify

    You can send either:
      { "claim": "the earth is flat" }
    or
      { "url": "https://example.com/article" }

    At least one of claim or url is required.
    """
    claim: Optional[str] = None
    url: Optional[str] = None


@router.post("/verify")
async def verify(request: VerifyRequest):
    """
    Quick Claim Check endpoint.

    Mounted in main.py with:
        app.include_router(verify_router, prefix="/api", tags=["verify"])

    So the full path is:
        POST /api/verify
    """

    claim_text = (request.claim or "").strip()
    url_text = (request.url or "").strip()

    if not claim_text and not url_text:
        raise HTTPException(
            status_code=400,
            detail="Either 'claim' or 'url' must be provided.",
        )

    # Use whichever was provided (claim preferred)
    query = claim_text or url_text

    # TODO: plug in your real analysis (OpenAI + search, etc.)
    # For now we return a simple, well-structured stub response so the
    # frontend can talk to the backend without 500 errors.
    verdict = "unknown"
    confidence = 0.0
    rationale = (
        "Stub verification response from /api/verify. "
        "The backend route is wired correctly; "
        "connect it to your analyzer or search service to get real results."
    )

    return {
        "query": query,
        "verdict": verdict,
        "confidence": confidence,
        "analysis": rationale,
    }

