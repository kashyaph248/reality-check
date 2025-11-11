import os
import json
import asyncio
from typing import List, Dict, Any

from fastapi import HTTPException
from openai import OpenAI

# Get API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    # Fail fast with clear message instead of mysterious 500
    raise RuntimeError(
        "OPENAI_API_KEY is not set. "
        "Set it in your .env (for local) and in Render environment variables."
    )

client = OpenAI(api_key=OPENAI_API_KEY)


async def _call_openai(prompt: str) -> Dict[str, Any]:
    """
    Run the OpenAI call in a thread so we don't block the event loop.
    We ask the model to return strict JSON.
    """

    def _sync_call() -> Dict[str, Any]:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Reality Check, an AI fact-checking assistant. "
                        "You MUST respond in valid JSON only, with this shape: "
                        "{"
                        '"verdict": "true" | "false" | "unclear", '
                        '"confidence": number between 0 and 1, '
                        '"reasoning": "short explanation", '
                        '"sources": ["optional", "list", "of", "urls"]'
                        "}"
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        raw = response.choices[0].message.content.strip()

        # Try to parse JSON directly
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # If model didn't obey, wrap it
            data = {
                "verdict": "unclear",
                "confidence": 0.0,
                "reasoning": raw,
                "sources": [],
            }

        # Normalize fields
        verdict = str(data.get("verdict", "unclear")).lower()
        if verdict not in {"true", "false", "unclear"}:
            verdict = "unclear"

        try:
            confidence = float(data.get("confidence", 0.0))
        except Exception:
            confidence = 0.0

        confidence = max(0.0, min(1.0, confidence))

        reasoning = str(data.get("reasoning", "")).strip()
        sources = data.get("sources", [])
        if not isinstance(sources, list):
            sources = []

        return {
            "verdict": verdict,
            "confidence": confidence,
            "reasoning": reasoning,
            "sources": sources,
        }

    # Run sync client in background thread
    return await asyncio.to_thread(_sync_call)


async def analyze_claim(claim: str, search_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Take the user claim + optional web search snippets,
    send to OpenAI, return normalized analysis dict.
    """

    if not claim:
        return {
            "verdict": "unclear",
            "confidence": 0.0,
            "reasoning": "No claim text provided.",
            "sources": [],
        }

    context_bits = []

    if search_results:
        # Expecting list of {title, url, snippet}
        for r in search_results[:5]:
            title = r.get("title") or ""
            url = r.get("url") or ""
            snippet = r.get("snippet") or ""
            if any([title, url, snippet]):
                context_bits.append(f"- {title} | {url} | {snippet}")

    context_text = "\n".join(context_bits) if context_bits else "No external results available."

    prompt = (
        "Evaluate the following claim using the provided context. "
        "Be careful about misinformation. If evidence is mixed or weak, use 'unclear'.\n\n"
        f"Claim:\n{claim}\n\n"
        f"Context:\n{context_text}\n"
    )

    try:
        result = await _call_openai(prompt)
        return result
    except Exception as e:
        # Don't crash the API: surface as safe response
        print("Error talking to OpenAI API:", repr(e))
        # You can also log e to a real logger here
        raise HTTPException(
            status_code=500,
            detail=f"Error talking to OpenAI API: {str(e)}",
        )

