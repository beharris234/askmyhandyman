"""Agent 3 — Scriptwriter. Brief -> ready-to-record script + post copy."""
from __future__ import annotations

from . import llm

SYSTEM = (
    "You are SCRIPTWRITER, an elite short-form video writer who optimizes for "
    "watch-time and conversion. You follow the conversion rules exactly and "
    "match the requested brand voice. Spoken lines are short and punchy."
)


def write(brief: dict) -> dict:
    prompt = (
        f"SCRIPT\n"
        f"TOPIC: {brief['angle']}\n"
        f"PLATFORM: {brief['platform']} (max {brief['spec']['max_seconds']}s)\n"
        f"GOAL: {brief['goal']}\n"
        f"CTA: {brief['cta']}\n"
        f"VOICE: {brief['voice']}\n"
        f"KEYWORD: {brief['keyword']}\n"
        f"CONVERSION RULES:\n{brief['rules']}\n\n"
        f"Return a JSON object with keys: "
        f'"hook" (<=12 words), "body" (the spoken script), "cta", '
        f'"caption" (platform-native, with the CTA), '
        f'"hashtags" (array of 4-6), "title" (<=70 chars).'
    )
    script = llm.complete_json(SYSTEM, prompt)
    script.setdefault("hashtags", [])
    return script
