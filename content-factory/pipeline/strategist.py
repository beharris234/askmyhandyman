"""Agent 2 — Strategist. Turns an angle into a per-platform content brief.

Bakes in the "high-converting" rules so every downstream script inherits them:
a 3-second hook, problem->agitate->solve, native captions, exactly one CTA.
"""
from __future__ import annotations

PLATFORM_SPEC = {
    "youtube_shorts": {"max_seconds": 60, "aspect": "9:16", "caption_len": 100},
    "tiktok":         {"max_seconds": 60, "aspect": "9:16", "caption_len": 150},
    "fb_reels":       {"max_seconds": 60, "aspect": "9:16", "caption_len": 125},
}

CONVERSION_RULES = (
    "1) HOOK in the first 3 seconds — a pattern interrupt or a bold claim. "
    "2) Structure: problem -> agitate -> solve. "
    "3) Keep one idea only; cut everything else. "
    "4) Exactly ONE call to action, matching the niche goal. "
    "5) Written for burned-in captions: short spoken sentences."
)


def brief(angle: dict, niche: dict) -> list[dict]:
    """One brief per requested platform."""
    briefs = []
    for platform in niche.get("platforms", ["youtube_shorts"]):
        spec = PLATFORM_SPEC.get(platform, PLATFORM_SPEC["youtube_shorts"])
        briefs.append({
            "platform": platform,
            "spec": spec,
            "angle": angle["angle"],
            "keyword": angle.get("keyword", ""),
            "goal": niche.get("goal", "awareness"),
            "cta": niche.get("cta", "Follow for more."),
            "voice": niche.get("voice", "Friendly expert."),
            "rules": CONVERSION_RULES,
        })
    return briefs
