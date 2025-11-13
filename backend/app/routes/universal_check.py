from typing import Optional, Dict, Any

from fastapi import APIRouter, Request
from pydantic import HttpUrl, ValidationError

router = APIRouter(tags=["universal-check"])


@router.get("/universal-check")
@router.get("/api/universal-check")
async def universal_check_info():
    """
    Simple info endpoint so GET /universal-check and /api/universal-check work.
    Useful for quick health checks or debugging.
    """
    return {
        "message": (
            "Use POST /api/universal-check (or /universal-check). "
            "You can send JSON or form-data. Optional fields: 'claim', 'url', 'extra_context'."
        ),
        "example_json_body": {
            "claim": "This news headline or statement to analyze.",
            "url": "https://example.com/article-or-video",
            "extra_context": "Anything else that may help the model understand."
        },
    }


async def _extract_body(request: Request) -> Dict[str, Any]:
    """
    Helper to safely extract data from either JSON or form-data requests.
    This avoids 400/422 errors if the frontend sends unexpected formats.
    """
    content_type = request.headers.get("content-type", "")

    # Default empty body
    body: Dict[str, Any] = {}

    try:
        if "application/json" in content_type:
            body = await request.json()
        elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
            form = await request.form()
            body = dict(form)
        else:
            # Try JSON as a fallback
            try:
                body = await request.json()
            except Exception:
                body = {}
    except Exception:
        # If anything goes wrong, just use an empty body
        body = {}

    return body


@router.post("/universal-check")
@router.post("/api/universal-check")
async def universal_check(request: Request):
    """
    Deep / universal check endpoint.

    - Accepts JSON or form-data.
    - Never raises 400 for missing fields.
    - Always returns a structured response the frontend can render.
    """

    raw_body = await _extract_body(request)

    raw_claim: Optional[str] = raw_body.get("claim") or raw_body.get("text") or None
    raw_url = raw_body.get("url")
    extra_context: Optional[str] = raw_body.get("extra_context") or raw_body.get("context") or None

    # Try to coerce URL into a valid HttpUrl if present
    url_str: Optional[str] = None
    if raw_url:
        try:
            # Basic validation using pydantic HttpUrl
            url_str = str(HttpUrl.validate(raw_url))
        except ValidationError:
            url_str = str(raw_url)

    # Build a human-readable summary of what we received
    summary_parts = []

    if raw_claim:
        if len(raw_claim) > 160:
            summary_parts.append(
                f"Received claim text for deep analysis: '{raw_claim[:160]}...'"
            )
        else:
            summary_parts.append(
                f"Received claim text for deep analysis: '{raw_claim}'"
            )

    if url_str:
        summary_parts.append(f"Attached URL: {url_str}")

    if extra_context:
        summary_parts.append("Extra context was provided for the analysis.")

    if not summary_parts:
        summary_parts.append(
            "No explicit claim, url, or extra_context fields were found in the request. "
            "Proceeding with a generic placeholder analysis."
        )

    summary_text = " ".join(summary_parts)

    # This is where you would call your real AI / tool chain.
    response = {
        "verdict": "unknown",       # e.g. "true", "false", "misleading", etc.
        "confidence": 0.0,          # 0–1 float if you implement scoring
        "claim": raw_claim,
        "url": url_str,
        "summary": summary_text,
        "notes": (
            "This is a placeholder universal / deep check result. "
            "The backend accepted the request and parsed what it could. "
            "You can now replace this logic with a real AI-powered analysis."
        ),
        "raw_body": raw_body,       # Helpful for debugging what the frontend actually sent
    }

    return response

