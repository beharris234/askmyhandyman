# Your AI Marketing Team

A team of specialist AI agents that live in this repo and market this
product. They run inside Claude Code (terminal, desktop app, web, or mobile) —
no extra tools, subscriptions, or API keys needed beyond Claude itself.

## The team

| Agent | What it does |
|---|---|
| `marketing-director` | Plans campaigns, sets priorities, briefs the others |
| `market-researcher` | Competitor teardowns, audience research, pricing — with sources |
| `copywriter` | Landing page copy, headlines, onboarding text — edits your HTML directly |
| `seo-specialist` | SEO audits and fixes, keyword strategy, content outlines |
| `social-media-manager` | Content calendars and paste-ready posts per platform |
| `email-marketer` | Welcome/onboarding/launch email sequences and broadcasts |
| `ads-specialist` | Small-budget ad tests and ad copy (with honest "not yet" gatekeeping) |

Agent definitions live in `.claude/agents/`. Every agent reads
`marketing/PRODUCT_BRIEF.md` first — that file is the team's shared memory.

## How to use it

**Talk to one specialist** — just ask in a Claude Code session:

> "Use the copywriter agent to rewrite the onboarding page headline."
> "Use the market-researcher agent to find where DJs hang out online."
> "Use the seo-specialist agent to audit this site and apply the fixes."

**Run the whole team on a goal:**

> `/marketing-campaign get my first 100 DJ signups`

Research → plan → deliverables across every channel that matters, saved
under `marketing/`.

**Weekly rhythm** (the habit that actually grows a product):

> `/marketing-weekly shipped the new income tracker; 12 signups this week`

You get a week's paste-ready content and a max-5-item human action list.

## Where output goes

```
marketing/
  PRODUCT_BRIEF.md   ← edit this first, everything flows from it
  research/          ← market & competitor reports
  campaigns/<name>/  ← campaign plans + channel briefs
  copy/              ← standalone copy (site edits go straight into HTML)
  seo/               ← audits & keyword maps
  social/            ← calendars & post batches
  email/             ← sequences, one file each
  ads/               ← test plans & ad copy
```

## First steps (do these in order)

1. Fill in the blanks in `PRODUCT_BRIEF.md` (pricing, production URL).
2. Run `/marketing-campaign get my first 100 signups`.
3. Do the human actions it gives you. Repeat weekly with `/marketing-weekly`.

## Reusing the team for your other products

The team is portable. For each new website or app:

1. Copy `.claude/agents/`, `.claude/commands/`, and
   `marketing/PRODUCT_BRIEF.md` into the new repo.
2. Rewrite `PRODUCT_BRIEF.md` for that product — this is the only file
   that's product-specific.
3. Run `/marketing-campaign` there.

## What the agents can't do (yet)

They produce everything ready-to-ship, but a human still: posts to social
accounts, sends emails through your email tool, sets ad budgets live, and
deploys site changes. If you later connect tools like Gmail or Canva to
Claude, the team can start executing more of this directly — ask Claude to
wire that up when you're ready.
