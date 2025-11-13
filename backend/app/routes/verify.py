from typing import Optional, Union

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from openai import OpenAI

router = APIRouter(tags=["verify"])

# OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    # Don't crash import; we'll error nicely on use
    client = None
else:
    client = OpenAI(api_key=OPENAI_API_KEY)


class VerifyRequest(BaseModel):
    claim: Optional[str] = None
    url: Optional[Union[HttpUrl, str]] = None

    def has_input(self) -> bool:
        return bool(
            (self.claim and self.claim.strip())
            or (self.url and str(self.url).strip())
        )


@router.get("/verify")
@router.get("/api/verify")
async def verify_info():
    """
    Simple info endpoint so GET /verify works (used by docs / health checks).
    """
    return {"message": "Use POST /verify with 'claim' and/or 'url' in the JSON body."}


@router.post("/verify")
@router.post("/api/verify")
async def verify(request: VerifyRequest):
    """
    Quick Claim Check endpoint.

    Expects JSON:
    {
      "claim": "the earth is flat",
      "url": "https://example.com/article"  # optional
    }
    Either 'claim' or 'url' is required.
    """
    if not request.has_input():
        raise HTTPException(
            status_code=400,
            detail="Either 'claim' or 'url' must be provided.",
        )

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured on the server.",
        )

    parts = []
    if request.claim:
        parts.append(f"Claim: {request.claim}")
    if request.url:
        parts.append(f"Related URL: {request.url}")

    prompt = (
        "You are a fact-checking assistant. Analyze the following input.\n"
        + "\n".join(parts)
        + "\n\n"
        "Return a concise JSON object with keys:\n"
        "  - verdict: one of ['true','false','misleading','uncertain']\n"
        "  - explanation: short explanation\n"
        "  - sources: list of 3-5 credible URLs\n"
        "Only output valid JSON."
    )

    try:
        completion = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a careful, concise fact-checking assistant.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.2,
        )
        content = completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error talking to OpenAI: {str(e)}",
        )

    # Don't try to eval/parse user-LM JSON here; just return it.
    return {
        "ok": True,
        "input": request.model_dump(),
        "analysis": content,
    }

