from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Request, UploadFile
from pydantic import HttpUrl, ValidationError

router = APIRouter(tags=["universal-check"])


@router.get("/universal-check")
@router.get("/api/universal-check")
async def universal_check_info():
    """
    Simple info endpoint so GET /universal-check and /api/universal-check work.
    Useful for quick health checks or debugging.
    """
    return {
        "message": (
            "Use POST /api/universal-check (or /universal-check). "
            "You can send JSON or form-data. Optional fields: 'claim', 'url', "
            "'extra_context', plus optional file fields like 'file', 'media', "
            "'upload', or 'media_file'."
        ),
        "example_json_body": {
            "claim": "This news headline or statement to analyze.",
            "url": "https://example.com/article-or-video",
            "extra_context": "Anything else that may help the model understand."
        },
    }


async def _extract_body_and_files(request: Request) -> Dict[str, Any]:
    """
    Helper to safely extract data from either JSON or form-data requests.

    - For JSON: returns the JSON body as a dict.
    - For form-data: returns normal fields as strings, and adds a special key
      'uploaded_files' with a list of UploadFile objects.

    This avoids 400/422 errors if the frontend sends unexpected formats.
    """
    content_type = request.headers.get("content-type", "") or ""

    body: Dict[str, Any] = {}
    uploaded_files: List[UploadFile] = []

    try:
        if "application/json" in content_type:
            # Standard JSON body
            body = await request.json()

        elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
            # FormData – may include both text fields and files
            form = await request.form()
            body = {}

            for key, value in form.items():
                # If this value is a file, store it in uploaded_files
                if isinstance(value, UploadFile):
                    uploaded_files.append(value)
                else:
                    # Normal text field
                    body[key] = value

        else:
            # Try JSON as a fallback
            try:
                body = await request.json()
            except Exception:
                body = {}

    except Exception:
        # If anything goes wrong, just use an empty body
        body = {}

    # Attach list of UploadFile objects so the route can inspect them
    body["uploaded_files"] = uploaded_files
    return body


@router.post("/universal-check")
@router.post("/api/universal-check")
async def universal_check(request: Request):
    """
    Deep / universal check endpoint.

    - Accepts JSON or form-data.
    - Can accept optional file uploads (image/video/etc).
    - Never raises 400 for missing fields.
    - Always returns a structured response the frontend can render.
    """

    raw_body = await _extract_body_and_files(request)

    # Text fields (claim/url/context)
    raw_claim: Optional[str] = (
        raw_body.get("claim")
        or raw_body.get("text")
        or raw_body.get("statement")
    )

    raw_url = raw_body.get("url")
    extra_context: Optional[str] = (
        raw_body.get("extra_context")
        or raw_body.get("context")
        or raw_body.get("notes")
    )

    # Uploaded files (from multipart/form-data)
    uploaded_files: List[UploadFile] = raw_body.get("uploaded_files", []) or []
    media_attached = len(uploaded_files) > 0
    media_filenames = [
        f.filename for f in uploaded_files
        if isinstance(f, UploadFile) and f.filename
    ]

    # Try to coerce URL into a valid HttpUrl if present
    url_str: Optional[str] = None
    if raw_url:
        try:
            url_str = str(HttpUrl.validate(raw_url))
        except ValidationError:
            # If validation fails, still include whatever string we got
            url_str = str(raw_url)

    # Build a human-readable summary of what we received
    summary_parts = []

    if raw_claim:
        if len(raw_claim) > 160:
            summary_parts.append(
                f"Received claim text for deep analysis: '{raw_claim[:160]}...'"
            )
        else:
            summary_parts.append(
                f"Received claim text for deep analysis: '{raw_claim}'"
            )

    if url_str:
        summary_parts.append(f"Attached URL: {url_str}")

    if extra_context:
        summary_parts.append("Extra context was provided for the analysis.")

    if media_attached:
        if len(media_filenames) == 1:
            summary_parts.append(
                f"Received 1 media file for analysis: {media_filenames[0]!r}."
            )
        elif len(media_filenames) > 1:
            summary_parts.append(
                f"Received {len(media_filenames)} media files for analysis: "
                + ", ".join(repr(name) for name in media_filenames)
                + "."
            )
        else:
            summary_parts.append(
                "Received at least one media file for analysis."
            )
    else:
        summary_parts.append(
            "No media files were attached for this universal check request."
        )

    if not summary_parts:
        summary_parts.append(
            "No explicit claim, url, extra_context, or media were found in the "
            "request payload. Proceeding with a generic placeholder analysis."
        )

    summary_text = " ".join(summary_parts)

    # 🔴 This is still a placeholder analysis.
    # Here is where you would plug in your real AI / tool chain (OpenAI, etc.).
    response = {
        "verdict": "unknown",       # e.g. "true", "false", "misleading", etc.
        "confidence": 0.0,          # 0–1 float if you implement scoring
        "claim": raw_claim,
        "url": url_str,
        "summary": summary_text,
        "notes": (
            "This is a placeholder universal / deep check result. "
            "The backend accepted the request, parsed the text fields, "
            "and detected any uploaded media files. "
            "You can now replace this logic with a real AI-powered analysis."
        ),
        "media_attached": media_attached,
        "media_filenames": media_filenames,
        # Keep raw_body for debugging what the frontend actually sent.
        # (Note: uploaded_files will be UploadFile objects, not bytes.)
        "raw_body_keys": [k for k in raw_body.keys() if k != "uploaded_files"],
    }

    return response


