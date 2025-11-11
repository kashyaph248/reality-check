from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from app.services.analyzer import analyze_claim
from app.services.search import search_web

router = APIRouter()


class VerifyRequest(BaseModel):
    claim: str = ""
    url: Optional[str] = None


@router.post("/verify")
async def verify(payload: VerifyRequest):
    """
    Quick claim check.
    Final URL (after main.py prefix): POST /api/verify
    """
    if not payload.claim and not payload.url:
        raise HTTPException(status_code=400, detail="No claim or URL provided")

    text = payload.claim or payload.url or ""
    search_results: List[dict] = []

    if payload.url:
        try:
            search_results = await search_web(payload.url)
        except Exception as e:
            print("Search error:", e)

    analysis = await analyze_claim(text, search_results)

    return {
        "status": "ok",
        "verdict": analysis.get("verdict", "unclear"),
        "confidence": analysis.get("confidence", 0.0),
        "reasoning": analysis.get("reasoning", ""),
        "sources": analysis.get("sources", []),
    }

