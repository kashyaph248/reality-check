from typing import Dict, Any

from fastapi import UploadFile
import filetype


async def analyze_media(file: UploadFile) -> Dict[str, Any]:
    """
    Lightweight placeholder for media analysis.

    - Reads the uploaded file
    - Uses `filetype` to guess mime type
    - Returns simple flags so the Universal Check UI has structured data

    This is intentionally simple so deployment is stable; you can upgrade
    it later with real deepfake / AI-image/video detection.
    """

    content = await file.read()

    kind = filetype.guess(content)
    mime_type = kind.mime if kind else "unknown"

    flags = []

    if mime_type.startswith("image/"):
        flags.append("image_detected")
    elif mime_type.startswith("video/"):
        flags.append("video_detected")
    else:
        flags.append("unknown_media_type")

    # Reset file pointer so FastAPI can re-read if needed later
    await file.seek(0)

    return {
        "mime_type": mime_type,
        "flags": flags,
        "analysis": "Basic media inspection complete (placeholder, no strong forgery signals).",
    }

