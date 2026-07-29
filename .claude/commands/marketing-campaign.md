---
description: Run the full AI marketing team on a goal — research, plan, then produce channel deliverables
---

You are coordinating the AI marketing team for this product. The founder's
goal is: $ARGUMENTS

If no goal was given, ask for one (e.g. "get my first 100 signups",
"launch on Product Hunt", "fill the waitlist").

Run the team in this order, passing each stage's output to the next:

1. Launch the **market-researcher** agent: research the audience, competitors,
   and where the target users hang out, scoped to this goal. It saves its
   report to `marketing/research/`.
2. Launch the **marketing-director** agent with the goal and the research
   report: it writes the campaign plan and per-channel briefs to
   `marketing/campaigns/<campaign-name>/`.
3. For each channel the plan prioritizes, launch the matching specialist
   (**copywriter**, **seo-specialist**, **social-media-manager**,
   **email-marketer**, **ads-specialist**) with its brief. Launch
   independent specialists in parallel.
4. Summarize for the founder: what was produced, where each file lives, and
   the single most important next action that only a human can do (e.g.
   "post the launch thread", "deploy the landing page changes").

Do not skip stage 1 — deliverables built on guesses get thrown away.
