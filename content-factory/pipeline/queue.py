"""The review queue — the heart of 'review before posting'.

Each content card is a row with a status:
  draft     -> just generated, awaiting your review
  approved  -> you OK'd it; Publisher may post it
  rejected  -> skip it
  posted    -> Publisher pushed it live

Stored as JSON so the static dashboard can read it with no backend. Swap this
module for Supabase later (same function names) without touching the pipeline.
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone

QUEUE_PATH = os.path.join(os.path.dirname(__file__), "..", "output", "queue.json")


def _load() -> list[dict]:
    if not os.path.exists(QUEUE_PATH):
        return []
    with open(QUEUE_PATH) as f:
        return json.load(f)


def _save(cards: list[dict]) -> None:
    os.makedirs(os.path.dirname(QUEUE_PATH), exist_ok=True)
    with open(QUEUE_PATH, "w") as f:
        json.dump(cards, f, indent=2)


def add(niche_slug: str, platform: str, script: dict, brief: dict) -> dict:
    cards = _load()
    card = {
        "id": str(uuid.uuid4())[:8],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "niche": niche_slug,
        "platform": platform,
        "status": "draft",
        "angle": brief["angle"],
        "script": script,
        "video_path": None,   # filled by Editor (Stage 2)
        "post_id": None,      # filled by Publisher (Stage 3)
    }
    cards.append(card)
    _save(cards)
    return card


def set_status(card_id: str, status: str) -> None:
    cards = _load()
    for c in cards:
        if c["id"] == card_id:
            c["status"] = status
    _save(cards)


def by_status(status: str) -> list[dict]:
    return [c for c in _load() if c["status"] == status]
