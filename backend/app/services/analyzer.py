import os
import json
from typing import List, Dict, Any
from openai import OpenAI

SYSTEM_PROMPT = """
You are Reality Check, an AI fact-verifier.

Given:
- A user claim or content.
- A list of web search results (titles, snippets, URLs).

Tasks:
1. Classify the claim as one of: "true", "false", "mixed", or "unclear".
2. Provide a confidence score between 0 and 1.
3. Provide supporting_sources: URLs that support the claim.
4. Provide contradicting_sources: URLs that contradict the claim.
5. Provide reasoning: 3-6 short bullet points. Be neutral and evidence-based.
6. If information is uncertain or sources conflict, say so clearly.

Only use information reasonably supported by the sources.
If there are no usable sources or it's ambiguous, use "unclear".
Return ONLY valid JSON.
"""

def analyze_claim(claim: str, search_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Always read key fresh from environment
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return {
            "verdict": "unclear",
            "confidence": 0.0,
            "supporting_sources": [],
            "contradicting_sources": [],
            "reasoning": ["OPENAI_API_KEY is not set on the server."],
        }

    # Create client with the real key
    client = OpenAI(api_key=api_key)

    # Build context string from search results
    sources_text = ""
    for i, r in enumerate(search_results, start=1):
        title = r.get("title", "")
        snippet = r.get("snippet", "")
        url = r.get("url", "")
        sources_text += f"[{i}] {title} - {snippet} ({url})\n"

    user_prompt = f"""
Claim or content to verify:
\"\"\"{claim}\"\"\"

Search results for context:
{sources_text if sources_text else "No search results were found or search is not configured."}

Respond in strict JSON with this structure:
{{
  "verdict": "true" | "false" | "mixed" | "unclear",
  "confidence": 0.0,
  "supporting_sources": ["https://..."],
  "contradicting_sources": ["https://..."],
  "reasoning": [
    "point 1",
    "point 2"
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",  # use a valid OpenAI chat model
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content
        parsed = json.loads(content)
    except Exception as e:
        # Bubble the error back for now so we can see what's wrong
        return {
            "verdict": "unclear",
            "confidence": 0.0,
            "supporting_sources": [],
            "contradicting_sources": [],
            "reasoning": [f"Error talking to OpenAI API: {e}"],
        }

    return {
        "verdict": parsed.get("verdict", "unclear"),
        "confidence": float(parsed.get("confidence", 0.0)),
        "supporting_sources": parsed.get("supporting_sources", []),
        "contradicting_sources": parsed.get("contradicting_sources", []),
        "reasoning": parsed.get("reasoning", []),
    }

