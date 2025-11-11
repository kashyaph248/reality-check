# app/routes/verify.py

from typing import Any, Dict, Optional

import inspect
import json
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, HttpUrl

from app.services.analyzer import analyze_claim

router = APIRouter(tags=["verify"])


class VerifyPayload(BaseModel):
    claim: Optional[str] = None
    url: Optional[HttpUrl] = None


ALT_CLAIM_KEYS = ("claim", "text", "input", "message", "query", "prompt")
ALT_URL_KEYS = ("url", "link")


async def extract_payload(request: Request) -> VerifyPayload:
    """
    Try very hard to figure out what the frontend sent.
    Supports:
      - JSON dict with many possible keys
      - JSON string
      - JSON list (joined)
      - form-data / urlencoded
      - raw text body
      - query parameters
    """
    claim: Optional[str] = None
    url: Optional[str] = None

    # 1) Raw body (we'll reuse this for both JSON and text)
    body_bytes = await request.body()
    body_text = body_bytes.decode("utf-8", errors="ignore").strip() if body_bytes else ""

    data: Dict[str, Any] = {}

    # 2) Try JSON first
    if body_text:
        try:
            parsed = json.loads(body_text)
        except Exception:
            parsed = None

        if isinstance(parsed, dict):
            data = parsed
        elif isinstance(parsed, str):
            # Body is just a JSON string => treat as claim
            claim = parsed.strip()
        elif isinstance(parsed, list):
            # Join list items into one claim
            joined = " ".join(str(x) for x in parsed).strip()
            if joined:
                claim = joined

    # 3) If not JSON dict, try form / urlencoded
    if not data:
        ctype = request.headers.get("content-type", "")
        if "application/x-www-form-urlencoded" in ctype or "multipart/form-data" in ctype:
            try:
                form = await request.form()
                data = dict(form)
            except Exception:
                pass

    # 4) Pull from dict-style body (JSON or form)
    if data:
        # Claim-like fields
        for key in ALT_CLAIM_KEYS:
            if key in data and isinstance(data[key], (str, int, float)):
                val = str(data[key]).strip()
                if val:
                    claim = val
                    break

        # URL-like fields
        for key in ALT_URL_KEYS:
            if key in data and isinstance(data[key], str):
                val = data[key].strip()
                if val:
                    url = val
                    break

    # 5) If still missing, use query params
    qp = request.query_params
    if not claim:
        qp_claim = qp.get("claim") or qp.get("q") or qp.get("text")
        if qp_claim:
            claim = qp_claim.strip()
    if not url:
        qp_url = qp.get("url") or qp.get("link")
        if qp_url:
            url = qp_url.strip()

    # 6) If STILL no claim but we had raw text body, treat raw as claim
    if not claim and body_text and not data:
        claim = body_text

    if not claim and not url:
        # This is the only case where we 400.
        raise HTTPException(
            status_code=400,
            detail="Either 'claim' or 'url' must be provided.",
        )

    return VerifyPayload(claim=claim or None, url=url or None)


async def run_analyzer(claim: Optional[str], url: Optional[str]):
    """
    Call analyze_claim in a way that works whether it's sync or async.
    """
    try:
        result = analyze_claim(claim=claim, url=url)
        if inspect.isawaitable(result):
            result = await result
        return result
    except HTTPException:
        raise
    except Exception as e:
        # Surface as 500 so you can see real error in Render logs
        raise HTTPException(
            status_code=500,
            detail=f"Error talking to analysis engine: {e}",
        )


@router.post("/verify")
async def verify(request: Request):
    """
    Quick Claim Check endpoint.

    Accepts many shapes. Recommended:
      POST /verify
      { "claim": "The earth is flat" }
    """
    payload = await extract_payload(request)
    result = await run_analyzer(
        claim=payload.claim,
        url=str(payload.url) if payload.url else None,
    )
    return {
        "ok": True,
        "input": payload.dict(),
        "result": result,
    }


@router.get("/verify")
async def verify_info():
    """
    Info endpoint for GET /verify.
    """
    return {
        "message": "Use POST /verify with 'claim' and/or 'url' in the body.",
        "accepted_keys": list(ALT_CLAIM_KEYS) + list(ALT_URL_KEYS),
        "example": {"claim": "The earth is flat"},
    }

