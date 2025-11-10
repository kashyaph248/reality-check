import os
import httpx
from typing import List, Dict, Any

SEARCH_API_KEY = os.getenv("SEARCH_API_KEY")
SEARCH_API_BASE_URL = os.getenv("SEARCH_API_BASE_URL") or "https://google.serper.dev/search"


async def search_web(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    """
    Use Serper.dev (Google Search) to fetch web results.
    Returns list of {title, url, snippet}.
    If not configured, returns [].
    """
    if not SEARCH_API_KEY:
        # Search not configured, gracefully return no results
        return []

    headers = {
        "X-API-KEY": SEARCH_API_KEY,
        "Content-Type": "application/json",
    }

    # Serper expects POST with 'q'
    body = {
        "q": query,
        "num": num_results,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(SEARCH_API_BASE_URL, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        # On any error (network/limit/etc), fail soft
        return []

    results: List[Dict[str, Any]] = []

    # Serper returns 'organic' results array
    organic = data.get("organic", []) or data.get("results", [])

    for item in organic[:num_results]:
        title = item.get("title") or ""
        url = item.get("link") or item.get("url") or ""
        snippet = item.get("snippet") or item.get("description") or ""
        if not url:
            continue

        results.append(
            {
                "title": title,
                "url": url,
                "snippet": snippet,
            }
        )

    return results

