from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from app.services.analyzer import analyze_claim
from app.services.search import search_web
from app.services.media_detector import analyze_media

router = APIRouter()


class UniversalCheckResponse(BaseModel):
    verdict: str
    confidence: float
    reasoning: str
    sources: List[str] = []
    media_flags: List[str] = []


@router.post("/universal-check", response_model=UniversalCheckResponse)
async def universal_check(
    claim: str = Form(""),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Deep / universal check for claims, URLs, and optional uploaded media.
    - Uses search + LLM for reasoning.
    - Uses media analysis (stub) for basic AI/forensics flags.
    """
    if not claim and not url and not file:
        raise HTTPException(status_code=400, detail="No input provided")

    # 1) Web search if URL provided
    search_results: List[dict] = []
    if url:
        try:
            search_results = await search_web(url)
        except Exception as e:
            print("Search error:", e)

    # 2) Media analysis (stubbed, but wired)
    media_flags: List[str] = []
    if file is not None:
        try:
            media_result = await analyze_media(file)
            media_flags = media_result.get("flags", [])
        except Exception as e:
            print("Media analysis error:", e)
            media_flags = ["media_analysis_failed"]

    # 3) Claim / text analysis
    text = claim or url or ""
    try:
        analysis = await analyze_claim(text, search_results)
    except Exception as e:
        print("Analyze claim error:", e)
        raise HTTPException(status_code=500, detail="AI analysis failed")

    return UniversalCheckResponse(
        verdict=analysis.get("verdict", "unclear"),
        confidence=float(analysis.get("confidence", 0.0)),
        reasoning=analysis.get("reasoning", "No reasoning available."),
        sources=analysis.get("sources", []),
        media_flags=media_flags,
    )

