from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import aiofiles
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/universal-check")
async def universal_check(
    claim: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Deep / Universal Check Endpoint
    Handles:
      - text claims
      - URLs
      - uploaded media (image/video)
    """

    # Validate at least one input
    if not claim and not url and not file:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of: 'claim', 'url', or file upload."
        )

    # --- Case 1: File Upload ---
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        file_id = str(uuid.uuid4()) + file_ext
        save_path = os.path.join(UPLOAD_DIR, file_id)

        async with aiofiles.open(save_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        analysis_type = "media"
        message = f"Uploaded file '{file.filename}' saved as '{file_id}' for deep analysis."
        source = save_path

    # --- Case 2: Text Claim ---
    elif claim:
        analysis_type = "text"
        message = f"Received text claim for verification: '{claim}'"
        source = claim

    # --- Case 3: URL Input ---
    else:
        analysis_type = "url"
        message = f"Received URL for verification: '{url}'"
        source = url

    # --- Placeholder Deep Analysis ---
    result = {
        "status": "ok",
        "analysis_type": analysis_type,
        "source": source,
        "summary": "This is a demo response from Reality Check API (universal mode).",
        "verdict": "unclear",
        "confidence": 0.0,
        "next_step": "Connect your AI or ML pipeline here for real results."
    }

    print(f"[Reality Check] Universal Check processed: {message}")

    return result


# Optional GET route for browser debugging
@router.get("/universal-check")
async def universal_check_info():
    return {
        "status": "ready",
        "usage": "POST /api/universal-check with form fields: claim | url | file"
    }

