# TaxAutopilot — Engine

The actual product. The marketing landing page lives one folder up at `taxautopilot/index.html`.

## What this is

A Next.js app that does the real work:

- **Phase 1** ✅ — Document Extraction (Claude Vision pulls every field out of W-2s, 1099s, etc.)
- **Phase 2** ✅ — Multi-tenant auth (tax offices sign up, get private client databases)
- **Phase 3** — Inbox intelligence (Gmail/Outlook OAuth, auto-file emails)
- **Phase 4** — Client comms (Twilio number, auto-replies, refund alerts)
- **Phase 5** — Desktop agent (writes into Drake/CrossLink/etc.)

## Quick start

```bash
npm install
cp .env.local.example .env.local
# Fill in ANTHROPIC_API_KEY and Supabase keys
npm run dev
```

Open http://localhost:3000.

## Setup — what you need

### 1. Anthropic API key (~$5-20/mo for testing)
- Go to https://console.anthropic.com/settings/keys
- Create a key, paste into `.env.local` as `ANTHROPIC_API_KEY`
- Powers document extraction

### 2. Supabase project (free tier is fine)
- Create a project at https://supabase.com/dashboard
- Go to Settings → API, copy the URL and `anon` key into `.env.local`
- Go to SQL Editor, paste in the contents of `supabase/migrations/0001_initial.sql`, run it
- This creates all tables with proper Row-Level Security

That's it. You're live.

## Routes

| Route | Auth | What it does |
|-------|------|--------------|
| `/` | — | Redirects to `/dashboard` if signed in, `/login` if not |
| `/demo` | Public | The extraction engine demo (no signup — use this for sales) |
| `/login`, `/signup` | Public | Auth pages |
| `/dashboard` | Required | Office home screen |
| `/clients` | Required | Client list |
| `/clients/new` | Required | Add a client |
| `/clients/[id]` | Required | Client detail with docs |
| `/api/extract` | Public | POST a document, get JSON back |

## Architecture

- **Frontend**: Next.js 16 App Router + Tailwind v4
- **Auth + DB**: Supabase (Postgres + RLS)
- **AI**: Anthropic Claude Sonnet 4.6 with vision and prompt caching
- **Hosting**: Vercel (deploy from `taxautopilot/app/` as project root)

## Multi-tenancy

Each tax office is one `organization` row. Users belong to an organization via `profiles.organization_id`. Every query on clients/documents/extractions is automatically scoped to the user's org via Postgres Row-Level Security — even if the app has a bug, the DB refuses cross-org access.
