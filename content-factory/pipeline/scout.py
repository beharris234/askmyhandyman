"""Agent 1 — Scout. Generates content angles for the niche.

Today it uses the LLM (or template fallback) seeded by the niche's seed_topics.
Stage 6 will enrich this with real trend signals (Google Trends / YouTube
search / Reddit) — those are free APIs; the interface here stays the same.
"""
from __future__ import annotations

from . import llm

SYSTEM = (
    "You are SCOUT, a short-form video trend researcher. Given a niche, produce "
    "scroll-stopping content angles that real people search for and share. "
    "Favor specific, concrete problems over generic topics."
)


def find_angles(niche: dict, count: int) -> list[dict]:
    seeds = ", ".join(niche.get("seed_topics") or []) or "(none — you choose)"
    prompt = (
        f"SCOUT\n"
        f"TOPIC: {niche['topic']}\n"
        f"AUDIENCE: {niche['audience']}\n"
        f"SEED TOPICS: {seeds}\n\n"
        f"Return a JSON array of {max(count, 3)} objects, each: "
        f'{{"angle": "<a specific, curiosity-driving angle>", '
        f'"keyword": "<core search keyword>"}}'
    )
    angles = llm.complete_json(SYSTEM, prompt)
    if isinstance(angles, dict):
        angles = [angles]
    return angles[:count]
