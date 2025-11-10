from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
import os
import base64
import json
import tempfile

from openai import OpenAI
from dotenv import load_dotenv
import httpx

load_dotenv(override=True)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SEARCH_API_KEY = os.getenv("SEARCH_API_KEY")
SEARCH_API_BASE_URL = os.getenv(
    "SEARCH_API_BASE_URL", "https://google.serper.dev/search"
)

client = OpenAI(api_key=OPENAI_API_KEY)
router = APIRouter()


def err(message: str, status: int = 400):
    return JSONResponse({"error": message}, status_code=status)


def to_data_url(raw: bytes, content_type: str) -> str:
    b64 = base64.b64encode(raw).decode("utf-8")
    if not content_type.startswith("image/"):
        content_type = "image/png"
    return f"data:{content_type};base64,{b64}"


async def search_web(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    """
    Uses Serper (or compatible) to search the web for likely matches.
    Relies on SEARCH_API_KEY and SEARCH_API_BASE_URL.
    """
    if not SEARCH_API_KEY or not query:
        return []

    headers = {
        "X-API-KEY": SEARCH_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {"q": query, "num": num_results}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client_http:
            resp = await client_http.post(
                SEARCH_API_BASE_URL, headers=headers, json=payload
            )
        if resp.status_code != 200:
            return []
        data = resp.json()
        results = []
        for item in data.get("organic", [])[:num_results]:
            url = item.get("link") or item.get("url")
            title = item.get("title") or ""
            if url:
                results.append({"title": title, "url": url})
        return results
    except Exception:
        return []


def sample_video_frames_to_data_urls(raw: bytes, max_frames: int = 3) -> List[str]:
    """
    Save video to temp, grab a few frames with OpenCV, return as data URLs.
    """
    import cv2  # lazy import

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(raw)
        tmp_path = tmp.name

    urls: List[str] = []

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            cap.release()
            return []

        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        if frame_count <= 0:
            cap.release()
            return []

        positions = [0.1, 0.5, 0.9]
        indices = sorted(
            set(max(0, min(frame_count - 1, int(frame_count * p))) for p in positions)
        )[:max_frames]

        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if not ok:
                continue
            ok, buf = cv2.imencode(".png", frame)
            if not ok:
                continue
            b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
            urls.append(f"data:image/png;base64,{b64}")

        cap.release()
        return urls
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


@router.post("/universal-check")
async def universal_check(
    mode: str = Form("standard"),
    text: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Universal authenticity checker:
    - image: AI-generated vs likely real + candidate sources
    - video: deepfake/AI vs likely real + candidate sources
    - url: credibility guess
    - text: factfulness + AI-style likelihood
    """

    if not OPENAI_API_KEY:
        return err("OPENAI_API_KEY is not set on the server.", 500)

    model = "gpt-4.1" if mode == "deep" else "gpt-4.1-mini"

    # 1️⃣ File upload (image / video)
    if file is not None:
        content_type = (file.content_type or "").lower()
        raw = await file.read()

        # 1a) Image
        if content_type.startswith("image/"):
            data_url = to_data_url(raw, content_type)

            system_msg = (
                "You are an AI media authenticity assistant. "
                "Given an image, estimate if it is AI-generated, heavily edited, or likely authentic. "
                "Be conservative (never 1.0). "
                "Also suggest a short web search query that could help find the original/source. "
                "Return STRICT JSON: {"
                '"type":"image",'
                '"verdict":"ai_generated"|"likely_real"|"unclear",'
                '"confidence":0-1,'
                '"signals":[short bullet points],'
                '"caveats":[short bullet points],'
                '"search_query":string'
                "}"
            )

            try:
                resp = client.chat.completions.create(
                    model=model,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system_msg},
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Analyze whether this image appears AI-generated or likely real, and propose a search query.",
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": data_url},
                                },
                            ],
                        },
                    ],
                    temperature=0.25,
                )

                content = resp.choices[0].message.content
                data = json.loads(content)

                # Reverse image-ish search via search_query
                candidate_sources: List[Dict[str, Any]] = []
                sq = data.get("search_query")
                if isinstance(sq, str) and sq.strip():
                    candidate_sources = await search_web(sq.strip(), num_results=5)

                data["candidate_sources"] = candidate_sources
                return JSONResponse(data)
            except Exception as e:
                return err(f"Image analysis failed: {e}", 500)

        # 1b) Video
        if content_type.startswith("video/"):
            frame_urls = sample_video_frames_to_data_urls(raw, max_frames=3)
            if not frame_urls:
                return err("Could not read frames from video for analysis.", 500)

            system_msg = (
                "You are a video authenticity assistant. "
                "Given several frames, estimate whether the video is likely authentic, AI-generated, or a deepfake. "
                "Be conservative. Also provide a short search query for potential source/context lookup. "
                "Return STRICT JSON: {"
                '"type":"video",'
                '"verdict":"deepfake"|"ai_generated"|"likely_real"|"unclear",'
                '"confidence":0-1,'
                '"signals":[short bullet points],'
                '"caveats":[short bullet points],'
                '"search_query":string'
                "}"
            )

            try:
                blocks: List[Dict[str, Any]] = [
                    {
                        "type": "text",
                        "text": "Analyze these frames from a video for deepfake/AI-generation likelihood, and suggest a search query.",
                    }
                ] + [
                    {"type": "image_url", "image_url": {"url": u}}
                    for u in frame_urls
                ]

                resp = client.chat.completions.create(
                    model=model,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": blocks},
                    ],
                    temperature=0.25,
                )

                content = resp.choices[0].message.content
                data = json.loads(content)

                candidate_sources: List[Dict[str, Any]] = []
                sq = data.get("search_query")
                if isinstance(sq, str) and sq.strip():
                    candidate_sources = await search_web(sq.strip(), num_results=5)

                data["candidate_sources"] = candidate_sources
                return JSONResponse(data)
            except Exception as e:
                return err(f"Video analysis failed: {e}", 500)

        return err(f"Unsupported file type: {content_type}", 400)

    # 2️⃣ URL
    if url:
        system_msg = (
            "You are a content authenticity analyst. "
            "You DO NOT fetch the URL; only reason from its structure/domain. "
            "Return STRICT JSON: {"
            '"type":"url",'
            '"verdict":"likely_trustworthy"|"suspicious"|"unclear",'
            '"confidence":0-1,'
            '"signals":[short bullet points],'
            '"caveats":[short bullet points]'
            "}"
        )
        try:
            resp = client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": f"Assess this URL: {url}"},
                ],
                temperature=0.3,
            )
            data = json.loads(resp.choices[0].message.content)
            return JSONResponse(data)
        except Exception as e:
            return err(f"URL analysis failed: {e}", 500)

    # 3️⃣ Text
    if text:
        system_msg = (
            "You are Reality Check Deep. "
            "Given a claim/passage, estimate truthfulness and AI-style likelihood. "
            "Return STRICT JSON: {"
            '"type":"text",'
            '"verdict":"true"|"false"|"mixed"|"unclear",'
            '"confidence":0-1,'
            '"ai_style_likelihood":0-1,'
            '"signals":[short bullet points],'
            '"caveats":[short bullet points]'
            "}"
        )
        try:
            resp = client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": text},
                ],
                temperature=0.25,
            )
            data = json.loads(resp.choices[0].message.content)
            return JSONResponse(data)
        except Exception as e:
            return err(f"Text analysis failed: {e}", 500)

    # 4️⃣ No input
    return err("No input provided. Send text, url, or media file.", 400)

