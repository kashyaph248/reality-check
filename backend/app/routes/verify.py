# app/routes/verify.py

from typing import Optional

import inspect
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, HttpUrl

from app.services.analyzer import analyze_claim

router = APIRouter(tags=["verify"])


class VerifyPayload(BaseModel):
    claim: Optional[str] = None
    url: Optional[HttpUrl] = None


async def extract_payload(request: Request) -> VerifyPayload:
    """
    Accepts claim/url from:
    - JSON: { "claim": "...", "url": "..." }
    - JSON: { "text" | "input" | "message" | "query": "..." }
    - JSON: { "link": "..." }
    - Query params: ?claim=...&url=...
    - Form-data / x-www-form-urlencoded with same keys
    """
    claim: Optional[str] = None
    url: Optional[str] = None

    # Try JSON body
    data = {}
    try:
        body = await request.json()
        if isinstance(body, dict):
            data = body
    except Exception:
        body = None  # Not JSON, ignore

    # If still empty, try form/multipart
    if not data:
        ctype = request.headers.get("content-type", "")
        if "application/x-www-form-urlencoded" in ctype or "multipart/form-data" in ctype:
            form = await request.form()
            data = dict(form)

    # Map common keys
    if data:
        claim = (
            data.get("claim")
            or data.get("text")
            or data.get("input")
            or data.get("message")
            or data.get("query")
        )
        url = data.get("url") or data.get("link")

    # Fall back to query params
    qp = request.query_params
    if not claim:
        claim = qp.get("claim")
    if not url:
        url = qp.get("url")

    if claim:
        claim = str(claim).strip()
    if url:
        url = str(url).strip()

    if not claim and not url:
        raise HTTPException(
            status_code=400,
            detail="Either 'claim' or 'url' must be provided.",
        )

    return VerifyPayload(claim=claim or None, url=url or None)


async def run_analyzer(claim: Optional[str], url: Optional[str]):
    """
    Call analyzer safely; supports sync or async implementations.
    """
    try:
        result = analyze_claim(claim=claim, url=url)
        if inspect.isawaitable(result):
            result = await result
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error talking to analysis engine: {e}",
        )


@router.post("/verify")
async def verify(request: Request):
    """
    Universal verify endpoint used by Quick Claim Check.

    Example JSON:
    {
      "claim": "The earth is flat"
    }
    """
    payload = await extract_payload(request)
    result = await run_analyzer(
        claim=payload.claim,
        url=str(payload.url) if payload.url else None,
    )
    return {"input": payload.dict(), "result": result}


@router.get("/verify")
async def verify_info():
    """
    Simple info for GET /verify
    """
    return {
        "message": "Use POST /verify with JSON body including 'claim' and/or 'url'.",
        "example": {"claim": "The earth is flat"},
    }

