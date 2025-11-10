from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from app.services.search import search_web
from app.services.analyzer import analyze_claim

router = APIRouter()


class VerifyRequest(BaseModel):
    text: Optional[str] = None
    url: Optional[HttpUrl] = None


class VerifyResponse(BaseModel):
    verdict: str
    confidence: float
    supporting_sources: List[str]
    contradicting_sources: List[str]
    reasoning: List[str]


@router.post("/verify", response_model=VerifyResponse)
async def verify_content(payload: VerifyRequest):
    if not payload.text and not payload.url:
        raise HTTPException(status_code=400, detail="Provide either 'text' or 'url'.")

    # Build claim
    if payload.text:
        claim = payload.text.strip()
    else:
        claim = f"Verify the main factual claims in the content at this URL: {payload.url}"

    # 1. Search web (if configured)
    search_results = await search_web(claim)

    # 2. Analyze with AI
    result = analyze_claim(claim, search_results)

    return VerifyResponse(**result)

