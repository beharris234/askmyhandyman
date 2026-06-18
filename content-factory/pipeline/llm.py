"""Provider-pluggable LLM layer.

Order of preference, picked at runtime by which env var is set:
  ANTHROPIC_API_KEY  -> Claude (best quality, paid)
  GEMINI_API_KEY     -> Gemini (generous free tier)
  (nothing)          -> built-in template engine ($0, no network, lower quality)

This means the pipeline always runs, even with no keys, so you can wire up the
whole flow before paying for anything.
"""
from __future__ import annotations

import json
import os
import re


def _provider() -> str:
    if os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic"
    if os.getenv("GEMINI_API_KEY"):
        return "gemini"
    return "template"


def complete(system: str, prompt: str, *, temperature: float = 0.8) -> str:
    """Return raw model text for a system+user prompt."""
    p = _provider()
    if p == "anthropic":
        return _anthropic(system, prompt, temperature)
    if p == "gemini":
        return _gemini(system, prompt, temperature)
    return _template(system, prompt)


def complete_json(system: str, prompt: str, *, temperature: float = 0.8) -> dict | list:
    """Like complete(), but coerces the response into parsed JSON."""
    raw = complete(system + "\n\nRespond with ONLY valid JSON, no prose.", prompt,
                   temperature=temperature)
    return _extract_json(raw)


# --- providers ---------------------------------------------------------------

def _anthropic(system: str, prompt: str, temperature: float) -> str:
    import anthropic  # lazy import so the dep is optional
    model = os.getenv("LLM_MODEL", "claude-sonnet-4-6")
    client = anthropic.Anthropic()
    msg = client.messages.create(
        model=model,
        max_tokens=2000,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(block.text for block in msg.content if block.type == "text")


def _gemini(system: str, prompt: str, temperature: float) -> str:
    from google import genai
    from google.genai import types
    model = os.getenv("LLM_MODEL", "gemini-2.0-flash")
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    resp = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system, temperature=temperature),
    )
    return resp.text or ""


# --- offline fallback --------------------------------------------------------

def _template(system: str, prompt: str) -> str:
    """Deterministic, keyless content so the pipeline runs with zero setup.

    It is intentionally simple — good enough to prove the flow end-to-end and
    to keep the dashboard populated. Swap in a real provider for quality.
    """
    topic = _find(prompt, r'TOPIC:\s*(.+)') or "your topic"
    cta = _find(prompt, r'CTA:\s*(.+)') or "Follow for more."
    if "SCOUT" in system:
        base = topic.split(",")[0]
        ideas = [f"The #1 mistake people make with {base}",
                 f"{base}: do this in under 60 seconds",
                 f"Pros never tell you this about {base}",
                 f"Stop wasting money on {base}",
                 f"{base} — fixed with one tool"]
        return json.dumps([{"angle": i, "keyword": base} for i in ideas])
    if "SCRIPT" in system:
        return json.dumps({
            "hook": f"You've been doing {topic} wrong this whole time.",
            "body": (f"Here's the 30-second fix. First, grab what you already "
                     f"have at home. Then do these three steps — most people "
                     f"skip step two and that's the whole problem. Done right, "
                     f"it lasts for years."),
            "cta": cta,
            "caption": f"Save this for {topic}. {cta}",
            "hashtags": ["#diy", "#howto", "#fyp", "#lifehack"],
            "title": f"{topic} — the 30-second fix",
        })
    return json.dumps({"angle": topic, "keyword": topic})


def _find(text: str, pattern: str) -> str | None:
    m = re.search(pattern, text)
    return m.group(1).strip() if m else None


def _extract_json(raw: str):
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"(\{.*\}|\[.*\])", raw, re.DOTALL)
        if m:
            return json.loads(m.group(1))
        raise
