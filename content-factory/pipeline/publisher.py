"""Agent 6 — Publisher (STAGE 3+, scaffolded). Posts APPROVED cards only.

Per-platform free APIs:
  youtube_shorts : YouTube Data API v3 (OAuth) — free, ~6 uploads/day quota
  fb_reels       : Meta Graph API — free, needs business account + app review
  tiktok         : Content Posting API — needs approval; until then, queue/manual

Safety: this never touches a card unless status == 'approved'. That's how
'review before posting' is enforced at the publish boundary.
"""
from __future__ import annotations

from . import queue


def publish_approved(dry_run: bool = True) -> list[dict]:
    results = []
    for card in queue.by_status("approved"):
        if card.get("video_path") is None and card["platform"] != "text":
            results.append({"id": card["id"], "skipped": "no video yet (run Editor)"})
            continue
        if dry_run:
            results.append({"id": card["id"], "would_post_to": card["platform"]})
            continue
        post_id = _dispatch(card)          # raises until a platform is wired up
        queue.set_status(card["id"], "posted")
        results.append({"id": card["id"], "post_id": post_id})
    return results


def _dispatch(card: dict) -> str:
    platform = card["platform"]
    raise NotImplementedError(
        f"Publisher for '{platform}' not wired yet. "
        "YouTube: google-api-python-client videos.insert. "
        "Meta: POST /{ig_user_id}/media then /media_publish. "
        "TikTok: /v2/post/publish/video/init/."
    )
