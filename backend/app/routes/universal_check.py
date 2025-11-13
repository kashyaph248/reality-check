from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

router = APIRouter(tags=["universal-check"])


class UniversalCheckRequest(BaseModel):
    """
    Request body for the deep / universal check.

    All fields are optional on purpose so the endpoint is forgiving.
    We only require that at least one of `claim` or `url` is provided.
    """
    claim: Optional[str] = None
    url: Optional[HttpUrl] = None
    extra_context: Optional[str] = None


@router.get("/universal-check")
@router.get("/api/universal-check")
async def universal_check_info():
    """
    Simple info endpoint so GET /universal-check and /api/universal-check work.
    Useful for quick health checks or debugging.
    """
    return {
        "message": (
            "Use POST /api/universal-check (or /universal-check) with JSON body "
            "containing at least 'claim' or 'url'. Optional: 'extra_context'."
        ),
        "example_body": {
            "claim": "This news headline or statement to analyze.",
            "url": "https://example.com/article-or-video",
            "extra_context": "Anything else that may help the model understand."
        },
    }


@router.post("/universal-check")
@router.post("/api/universal-check")
async def universal_check(request: UniversalCheckRequest):
    """
    Deep / universal check endpoint.

    This is meant to perform a heavier analysis than the quick /verify check.
    For now, it returns a structured stub response that you can later
    connect to your OpenAI / external tools logic.
    """

    # Basic validation: we need at least a claim or a URL to work with.
    if not request.claim and not request.url:
        raise HTTPException(
            status_code=400,
            detail="Provide at least 'claim' or 'url' in the request body.",
        )

    # --- PLACEHOLDER ANALYSIS LOGIC ---
    # This is where you would plug in your real deep analysis:
    #
    #  - call your OpenAI client
    #  - use browsing / tools
    #  - check media, patterns, etc.
    #
    # For now, we just return a neutral structured response so the
    # frontend has something to render instead of a 400 error.

    analysis_summary_parts = []

    if request.claim:
        analysis_summary_parts.append(
            f"Received claim text for deep analysis: '{request.claim[:120]}...'"
            if len(request.claim) > 120
            else f"Received claim text for deep analysis: '{request.claim}'"
        )

    if request.url:
        analysis_summary_parts.append(f"Attached URL: {request.url}")

    if request.extra_context:
        analysis_summary_parts.append(
            "Additional context provided for analysis."
        )

    if not analysis_summary_parts:
        analysis_summary_parts.append(
            "No detailed information was supplied beyond minimal fields."
        )

    summary_text = " ".join(analysis_summary_parts)

    # You can change these fields to match what your frontend expects.
    response = {
        "verdict": "unknown",          # e.g. "true", "false", "misleading", "mixed", etc.
        "confidence": 0.0,             # 0–1 float if you implement scoring
        "claim": request.claim,
        "url": str(request.url) if request.url else None,
        "summary": summary_text,
        "notes": (
            "This is a placeholder deep/universal check result. "
            "Hook this endpoint into your real AI analysis logic."
        ),
    }

    return response

