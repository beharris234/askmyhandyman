#!/usr/bin/env python3
"""Content Factory orchestrator.

Runs the text pipeline (Scout -> Strategist -> Scriptwriter) and drops draft
cards into the review queue. Video render + publishing are separate, gated
stages so nothing goes live without your approval.

Usage:
    python3 run.py --niche config/niche.example.yaml --count 3
    python3 run.py --niche config/handyman.yaml --publish     # dry-run by default
"""
from __future__ import annotations

import argparse
import sys

import yaml

from pipeline import scout, strategist, scriptwriter, queue, publisher


def load_niche(path: str) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def generate(niche: dict, count: int) -> None:
    print(f"🔎 Scout: finding {count} angle(s) for '{niche['slug']}'...")
    angles = scout.find_angles(niche, count)
    made = 0
    for angle in angles:
        print(f"  • {angle['angle']}")
        for brief in strategist.brief(angle, niche):
            script = scriptwriter.write(brief)
            card = queue.add(niche["slug"], brief["platform"], script, brief)
            made += 1
            print(f"      → {brief['platform']}: queued draft {card['id']} "
                  f"— \"{script.get('hook', '')[:50]}\"")
    print(f"\n✅ Queued {made} draft card(s). Review them in the dashboard:")
    print("   python3 -m http.server 8000  →  http://localhost:8000/dashboard/")


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Content Factory")
    ap.add_argument("--niche", required=True, help="path to niche YAML")
    ap.add_argument("--count", type=int, default=1, help="angles to generate")
    ap.add_argument("--publish", action="store_true",
                    help="publish APPROVED cards (dry-run unless --live)")
    ap.add_argument("--live", action="store_true", help="actually post (off by default)")
    args = ap.parse_args(argv)

    niche = load_niche(args.niche)

    if args.publish:
        results = publisher.publish_approved(dry_run=not args.live)
        for r in results:
            print(r)
        return 0

    generate(niche, args.count)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
