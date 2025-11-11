from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import inspect

from app.services.search import search_claim

router = APIRouter()


class VerifyRequest(BaseModel):
    """
    Request body for /api/verify

    - Provide either `claim` (plain text) or `url`.
    - At least one is required.
    """
    claim: Optional[str] = None
    url: Optional[str] = None


@router.post("/verify")
async def verify(request: VerifyRequest):
    """
    Quick Claim Check endpoint.

    Frontend calls: POST /api/verify
    Body: { "claim": "the earth is flat" }  OR  { "url": "https://..." }

    Uses `search_claim` to get evidence / verdict.
    """

    # Pick whichever field is provided (claim preferred)
    claim_text = (request.claim or "").strip()
    url_text = (request.url or "").strip()

    if not claim_text and not url_text:
        # This 400 is what the frontend shows as "No claim or URL provided"
        raise HTTPException(
            status_code=400,
            detail="Either 'claim' or 'url' must be provided.",
        )

    query = claim_text or url_text

    try:
        # Support both async and sync implementations of search_claim
        if inspect.iscoroutinefunction(search_claim):
            result = await search_claim(query)
        else:
            result = search_claim(query)
    except Exception as e:
        # Surface as 500 so frontend knows it's a backend error
        raise HTTPException(
            status_code=500,
            detail=f"Error while verifying claim: {str(e)}",
        ) from e

    # Normalize the response so the frontend can rely on it
    return {
        "query": query,
        "result": result,
    }

