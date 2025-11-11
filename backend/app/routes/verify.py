from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class VerifyRequest(BaseModel):
    """
    Request body for /api/verify.
    The frontend can send either:
    {
        "claim": "the earth is flat"
    }
    or
    {
        "url": "https://example.com/news"
    }
    """
    claim: Optional[str] = None
    url: Optional[str] = None


@router.post("/verify")
async def verify(request: VerifyRequest):
    """
    Quick Claim Verification Endpoint
    This route handles both claim-based and URL-based verification.
    """
    claim = (request.claim or "").strip()
    url = (request.url or "").strip()

    # Handle empty input gracefully
    if not claim and not url:
        raise HTTPException(
            status_code=400,
            detail="Either 'claim' or 'url' must be provided."
        )

    # Choose whichever is provided
    query = claim or url

    # Placeholder logic (replace with real AI/search logic later)
    # For now, return a clear dummy analysis.
    verdict = "unknown"
    confidence = 0.0
    rationale = (
        "This is a test response from Reality Check API. "
        "Your backend and CORS setup are working perfectly. "
        "Connect this endpoint to your AI fact-checking logic next."
    )

    return {
        "query": query,
        "verdict": verdict,
        "confidence": confidence,
        "rationale": rationale,
        "status": "ok"
    }


# Optional GET version for browser debug (not required for frontend)
@router.get("/verify")
async def verify_info():
    """
    Simple info route for debugging in browser.
    """
    return {
        "status": "ready",
        "usage": "POST /api/verify with JSON body {'claim': 'your text'} or {'url': 'https://...'}"
    }

