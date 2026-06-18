# Content Factory 🏭

A **free, autopilot social-content engine**. You give it a niche ("domain"),
sub-agents research → strategize → write → render → queue conversion-optimized
content for **YouTube Shorts, TikTok, and Facebook/Instagram Reels**. You review
and approve, then it posts.

> Status: MVP foundation. The **text pipeline runs today** (with or without an
> API key). Video render + platform publishing are scaffolded with a free stack
> and turned on stage-by-stage. See the roadmap at the bottom.

---

## How it works (the 7 sub-agents)

```
niche config ─► [1 Scout] ─► [2 Strategist] ─► [3 Scriptwriter] ─► [4 Visual Director]
                                                                          │
              you approve in the dashboard ◄── [review queue] ◄── [5 Editor] ◄──┘
                              │
                              ▼
                       [6 Publisher] ─► YouTube / Meta / TikTok ─► [7 Analyst] ─► back to Strategist
```

| # | Agent | What it does | Free tool |
|---|-------|--------------|-----------|
| 1 | **Scout** | Trending angles & keywords for the niche | Google Trends, YouTube search, Reddit |
| 2 | **Strategist** | Picks angle + platform + hook + CTA | LLM |
| 3 | **Scriptwriter** | Hook-first, retention-tuned, one CTA | LLM |
| 4 | **Visual Director** | Image prompts / b-roll picks | Pexels, Pixabay, Pollinations, Canva |
| 5 | **Editor** | TTS voiceover + visuals + burned-in captions | edge-tts, Whisper, ffmpeg |
| 6 | **Publisher** | Uploads + title/desc/hashtags/thumbnail | YouTube Data API, Meta Graph API |
| 7 | **Analyst** | Pulls metrics, feeds winners back | Platform analytics APIs |

**Why it's free:** state in JSON (or Supabase), compute on **GitHub Actions cron**
(2,000 free min/mo), faceless video instead of paid AI avatars, free TTS/stock/captions.

---

## The "domain name" → niche config

This is the single input that drives everything. See `config/niche.example.yaml`.

```yaml
slug: handyman
topic: "Home repair & handyman tips"
audience: "Homeowners 30-55, DIY-curious, time-poor"
goal: "leads"          # leads | subscribers | sales | awareness
cta: "Comment 'FIX' and I'll send you the checklist"
platforms: [youtube_shorts, tiktok, fb_reels]
voice: "Confident, friendly expert. Plain talk, no jargon."
cadence_per_day: 1
```

"High-converting" is **enforced structure**, not luck: a 3-second pattern-interrupt
hook, problem → agitate → solve, native captions, and exactly one CTA. Those rules
live in the Strategist/Scriptwriter prompts so every output follows them.

---

## Quick start (text pipeline — runs now)

```bash
cd content-factory
python3 -m pip install -r requirements.txt        # only pyyaml needed for text-only

# Optional: real LLM. Without a key it uses a built-in template engine.
export ANTHROPIC_API_KEY=sk-...                    # or GEMINI_API_KEY (free tier)

python3 run.py --niche config/niche.example.yaml --count 3
```

This produces draft content cards in `output/queue.json`. Open the dashboard to review:

```bash
python3 -m http.server 8000        # then visit http://localhost:8000/dashboard/
```

Approve/reject cards in the dashboard. Approved cards are what the Publisher will post.

---

## Free LLM options

| Provider | Cost | Set env |
|----------|------|---------|
| Template engine (built-in) | $0, no key, lower quality | *(nothing)* |
| Google Gemini | Generous free tier | `GEMINI_API_KEY` |
| Anthropic Claude | Paid, best quality | `ANTHROPIC_API_KEY` |

Model is configurable via `LLM_MODEL` (defaults to `claude-sonnet-4-6` for Claude,
`gemini-2.0-flash` for Gemini). Use a cheaper model like `claude-haiku-4-5` to cut cost.

---

## Roadmap

- [x] **Stage 1 — Text pipeline** (Scout → Strategist → Scriptwriter) + review dashboard
- [ ] **Stage 2 — Editor**: edge-tts voiceover + Pexels b-roll + Whisper captions → mp4 (`render.py`)
- [ ] **Stage 3 — YouTube Publisher**: OAuth + Data API upload of approved cards
- [ ] **Stage 4 — Cron**: GitHub Action generates daily, you approve from your phone
- [ ] **Stage 5 — Meta + TikTok** publishers
- [ ] **Stage 6 — Analyst**: pull metrics, rank hooks, feed winners back to Strategist

See `.github/workflows/content-factory.yml` for the free scheduler.
