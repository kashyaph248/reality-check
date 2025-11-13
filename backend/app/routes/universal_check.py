# app/routes/universal_check.py

from __future__ import annotations

import base64
import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any, Dict, Literal, Optional

import cv2  # opencv-python-headless is in requirements.txt
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from openai import OpenAI

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------- Config ---------- #

BACKEND_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BACKEND_ROOT / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
client = OpenAI()  # uses OPENAI_API_KEY from env


# ---------- Helpers ---------- #


def _encode_image_file_to_data_url(path: Path) -> str:
    """
    Read an image file and return a data: URL suitable for OpenAI vision.
    """
    with path.open("rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    # We’ll just call everything jpeg for OpenAI; it only cares about the pixels.
    mime = "image/jpeg"
    return f"data:{mime};base64,{b64}"


def _extract_video_frames_to_data_urls(
    path: Path, max_frames: int = 4
) -> list[str]:
    """
    Sample up to `max_frames` frames from a video and return them as data: URLs.
    This keeps the payload small while still giving OpenAI some visual context.
    """
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        logger.warning("Could not open video file: %s", path)
        return []

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if frame_count <= 0:
        # fall back to reading first few frames sequentially
        frame_indices = list(range(max_frames))
    else:
        step = max(frame_count // max_frames, 1)
        frame_indices = [i * step for i in range(max_frames)]

    data_urls: list[str] = []

    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ok, frame = cap.read()
        if not ok or frame is None:
            continue

        ok, buffer = cv2.imencode(".jpg", frame)
        if not ok:
            continue

        b64 = base64.b64encode(buffer.tobytes()).decode("utf-8")
        data_urls.append(f"data:image/jpeg;base64,{b64}")

    cap.release()
    return data_urls


def _call_openai_media_analyzer(
    media_type: Literal["image", "video"],
    media_data_urls: list[str],
) -> Dict[str, Any]:
    """
    Send image(s) (or sampled video frames) to OpenAI for forensic-style analysis.
    We ask for JSON so the frontend can render it nicely.
    """
    if not media_data_urls:
        raise ValueError("No media frames available for analysis")

    user_content: list[dict[str, Any]] = []

    if media_type == "image":
        user_content.append(
            {
                "type": "text",
                "text": (
                    "Analyze this image for signs of AI-generation, editing, "
                    "or manipulation. Give a short JSON report with:\n"
                    "- summary (2–3 sentences)\n"
                    "- verdict (real, likely_real, ai_generated, unclear)\n"
                    "- confidence (0–1)\n"
                    "- key_signals (list of short bullet points)\n"
                    "- cautions (list of short bullet points)"
                ),
            }
        )
        user_content.append(
            {
                "type": "image_url",
                "image_url": {"url": media_data_urls[0]},
            }
        )
    else:  # video
        user_content.append(
            {
                "type": "text",
                "text": (
                    "You are a media forensics assistant. The following images "
                    "are frames sampled from a video. Analyze them for signs of "
                    "AI-generation, deepfake artifacts, or obvious editing. "
                    "Return a short JSON report with:\n"
                    "- summary (2–3 sentences)\n"
                    "- verdict (real, likely_real, ai_generated, unclear)\n"
                    "- confidence (0–1)\n"
                    "- key_signals (list of short bullet points)\n"
                    "- cautions (list of short bullet points)"
                ),
            }
        )
        for url in media_data_urls:
            user_content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": url},
                }
            )

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert in media forensics. Be careful and "
                    "avoid over-claiming. If evidence is weak, keep confidence low."
                ),
            },
            {
                "role": "user",
                "content": user_content,
            },
        ],
    )

    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Fallback: wrap the raw text
        return {
            "summary": content,
            "verdict": "unclear",
            "confidence": 0.0,
            "key_signals": [],
            "cautions": ["Model response was not valid JSON; using raw text."],
        }


def run_media_analysis(
    file_path: Path,
    media_type: Literal["image", "video"],
) -> Dict[str, Any]:
    """
    Main media-analysis helper used by the universal-check route.
    Returns a JSON-serializable dict in the same shape the frontend expects.
    """
    if media_type == "image":
        data_url = _encode_image_file_to_data_url(file_path)
        media_data_urls = [data_url]
    else:
        media_data_urls = _extract_video_frames_to_data_urls(file_path)
        if not media_data_urls:
            raise HTTPException(
                status_code=400,
                detail="Could not read frames from video for analysis.",
            )

    ai_report = _call_openai_media_analyzer(media_type, media_data_urls)

    summary = ai_report.get(
        "summary",
        "Automatic media analysis completed. Model did not provide a summary.",
    )
    verdict = ai_report.get("verdict", "unclear")
    confidence = float(ai_report.get("confidence", 0.0))

    return {
        "status": "ok",
        "analysis_type": "media",
        "media_kind": media_type,
        "source": f"uploads/{file_path.name}",
        "summary": summary,
        "verdict": verdict,
        "confidence": confidence,
        "key_signals": ai_report.get("key_signals", []),
        "cautions": ai_report.get("cautions", []),
        "raw": ai_report,
    }


def run_text_or_url_analysis(
    claim: Optional[str],
    url: Optional[str],
    deep: bool,
) -> Dict[str, Any]:
    """
    Fallback universal analysis for text / URL when no media file is present.
    This is separate from the /verify quick check but uses a similar idea.
    """
    if not claim and not url:
        raise HTTPException(
            status_code=400,
            detail="Either 'claim' or 'url' must be provided.",
        )

    prompt_parts = []
    if claim:
        prompt_parts.append(f"Claim:\n{claim}\n")
    if url:
        prompt_parts.append(f"URL to inspect:\n{url}\n")
    if deep:
        depth_instruction = (
            "Do a deeper reasoning pass and consider multiple possibilities."
        )
    else:
        depth_instruction = "Give a concise answer."

    user_prompt = (
        "Analyze the following claim and/or URL for truthfulness, risk, and "
        "possible misinformation. "
        "Return a short JSON object with:\n"
        "- summary (2–3 sentences)\n"
        "- verdict (true, likely_true, false, likely_false, mixed, unclear)\n"
        "- confidence (0–1)\n"
        "- key_points (list of short bullet points)\n"
        "- suggested_sources (list of URLs if possible)\n\n"
        f"{depth_instruction}\n\n" + "\n\n".join(prompt_parts)
    )

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a careful fact-checking assistant. Use reliable "
                    "sources, but never pretend certainty where there is none."
                ),
            },
            {"role": "user", "content": user_prompt},
        ],
    )

    content = response.choices[0].message.content
    try:
        report = json.loads(content)
    except json.JSONDecodeError:
        report = {
            "summary": content,
            "verdict": "unclear",
            "confidence": 0.0,
            "key_points": [],
            "suggested_sources": [],
        }

    return {
        "status": "ok",
        "analysis_type": "text",
        "summary": report.get("summary", ""),
        "verdict": report.get("verdict", "unclear"),
        "confidence": float(report.get("confidence", 0.0)),
        "key_points": report.get("key_points", []),
        "suggested_sources": report.get("suggested_sources", []),
        "raw": report,
    }


def save_upload(file: UploadFile) -> tuple[Path, Literal["image", "video"]]:
    """
    Save an uploaded image or video to the uploads/ folder and return path + media type.
    """
    content_type = file.content_type or ""
    if content_type.startswith("image/"):
        media_type: Literal["image", "video"] = "image"
    elif content_type.startswith("video/"):
        media_type = "video"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported media type: {content_type}",
        )

    suffix = Path(file.filename or "").suffix or ""
    safe_name = f"{uuid.uuid4().hex}{suffix}"
    dest_path = UPLOADS_DIR / safe_name

    with dest_path.open("wb") as f:
        f.write(file.file.read())

    logger.info("Saved upload %s (%s) to %s", file.filename, content_type, dest_path)
    return dest_path, media_type


# ---------- Routes ---------- #


@router.get("/universal-check")
async def universal_check_info() -> Dict[str, Any]:
    """
    Lightweight GET endpoint used by the frontend to confirm the route exists.
    """
    return {
        "message": "Reality Check universal endpoint",
        "usage": "POST /universal-check with claim/url/file for deep analysis.",
    }


@router.post("/universal-check")
async def universal_check(
    claim: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    deep: bool = Form(False),
    file: Optional[UploadFile] = File(None),
):
    """
    Deep / Universal Check endpoint.

    - If `file` is provided: run media analysis (image/video).
    - Else: run deeper text/URL analysis.
    """
    try:
        if file is not None:
            saved_path, media_type = save_upload(file)
            result = run_media_analysis(saved_path, media_type)
        else:
            result = run_text_or_url_analysis(claim, url, deep)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Universal check error: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Error while running universal check.",
        ) from exc

    return JSONResponse(result)

