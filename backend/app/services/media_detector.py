import os
import httpx
from typing import Literal, Dict, Any

HIVE_API_KEY = os.getenv("HIVE_API_KEY")

if not HIVE_API_KEY:
    # We won't crash on import, but will surface a clear error at call-time
    pass

# Adjust this endpoint according to Hive's latest docs for
# AI-generated image/video + deepfake detection.
# See: Hive "AI-Generated Image and Video Detection" docs.
HIVE_ENDPOINT = "https://api.thehive.ai/api/v2/task/ai_generated_image_and_video_detection"

Verdict = Literal["ai_generated", "likely_real", "deepfake", "unclear"]

async def analyze_media_with_hive(file_bytes: bytes, content_type: str) -> Dict[str, Any]:
    """
    Sends media to Hive for AI-generated / deepfake detection.
    Returns a normalized structure Reality Check can use.
    """

    if not HIVE_API_KEY:
        return {
            "verdict": "unclear",
            "confidence": 0.0,
            "provider": "hive",
            "error": "HIVE_API_KEY not set",
        }

    # Build multipart form-data
    files = {
        "file": ("upload", file_bytes, content_type),
    }

    headers = {
        "Authorization": f"Token {HIVE_API_KEY}",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(HIVE_ENDPOINT, headers=headers, files=files)

    if resp.status_code != 200:
        return {
            "verdict": "unclear",
            "confidence": 0.0,
            "provider": "hive",
            "error": f"Hive API error {resp.status_code}: {resp.text[:200]}",
        }

    data = resp.json()

    # NOTE: This parsing depends on Hive's response schema.
    # Rough pattern (you must align with their docs/dashboard):
    # - Look for ai_generated / not_ai_generated / deepfake classes + scores.

    classes = data.get("output", {}).get("classes") or data.get("classes") or []
    verdict: Verdict = "unclear"
    confidence = 0.0
    signals = []

    for c in classes:
        name = c.get("class") or c.get("label") or ""
        score = float(c.get("score") or c.get("confidence") or 0.0)

        if name in ("ai_generated", "ai_generated_image", "ai_generated_video") and score > confidence:
            verdict = "ai_generated"
            confidence = score
            signals.append(f"AI-generated signal ({score:.2f})")

        elif name in ("not_ai_generated", "human_made") and score > confidence:
            verdict = "likely_real"
            confidence = score
            signals.append(f"Human-made signal ({score:.2f})")

        elif name == "deepfake":
            # Deepfake often returns its own score; you may treat it separately.
            if score > confidence:
                verdict = "deepfake"
                confidence = score
                signals.append(f"Deepfake signal ({score:.2f})")

    # Normalize to your Reality Check format
    return {
        "verdict": verdict,
        "confidence": round(confidence, 3),
        "provider": "hive",
        "raw": data,
        "signals": signals,
    }

