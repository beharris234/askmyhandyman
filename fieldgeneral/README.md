# FieldGeneral — the coach's AI chief of staff

The head coach sets his **voice** once. The AI writes the day's **workout + message** for each
position group *in his voice*, players tap their **check-ins** (lift / food / film), and the coach
opens one screen and sees a **green / yellow / red accountability board** of who's bought in.

Built on **your** stack: static PWA → **Vercel** hosting, **Supabase** (Postgres + Auth),
**Claude API** for generation, **Brevo** for email (Phase 1). No Railway, no Clerk, no Twilio —
those were swapped out for what you already use.

> This is **Phase 0 — the hot dog stand**: one thing done well. It runs **today with zero setup**
> in demo mode, then flips to live when you add keys.

---

## Try it right now (demo mode — no accounts, no keys)

It already works. Open `index.html` (locally or once deployed). You'll get **demo mode**:
no login, data saves in your browser. Walk the full loop:

1. **Onboarding** → create a coach, paste 3–5 example texts (your voice), add a few players.
2. **Dashboard** → pick a position group, type a vibe, **Generate today's drop** → review the
   workout + message → **Approve & send**. Or "Generate for every group" in one tap.
3. **Player links** → copy a player's link, open it → check in (lift / food / film).
4. Back on the dashboard → watch the **green/yellow/red board** and **auto-nudge** update.

The message + workout are written by a built-in **local engine** so nothing is blocked. When you
add a Claude key (below), the exact same button calls **Claude** instead — no code change.

---

## Going live (3 short steps, your stack)

### 1. Supabase (database + auth)
- Create a project → **SQL Editor** → paste `schema.sql` and run it.
- Copy **Project URL** + **anon key** (Settings → API) into `config.js`
  (`SUPABASE_URL`, `SUPABASE_KEY`). Demo mode turns off automatically.

### 2. Claude AI (optional but it's the magic)
Keeps your key server-side via a Supabase Edge Function:
```bash
supabase functions deploy generate-daily
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
Now "Generate today's drop" produces real, voice-matched AI writing.

### 3. Vercel (hosting)
Deploy this `fieldgeneral/` folder as its own Vercel project
(**Root Directory = `fieldgeneral`**). `vercel.json` is already set for static + PWA.

---

## Child-safety guardrails (baked in — also the selling point to schools/parents)

- **No individualized calorie/macro/diet targets** for players — general healthy-habit guidance only.
- **Injuries always route to the athletic trainer** — the app never diagnoses or treats.
- **No private adult–minor channel** — everything is team/group context and parent-visible.
- **Players never pay** and never enter payment info — the coach is the customer.
- **Athlete's goals + personal notes are private to the athlete** — the coach cannot read
  them (enforced in `schema.sql`: no coach RLS policy on `goals`/`notes`). The only exception
  is a note the athlete *chooses* to flag for the athletic trainer (injury/pain).

**Phase-1 security gate (before real student data):** player reads/writes currently use the anon
key with a per-player token (fine for demo). Move them behind a Supabase Edge Function that
validates the token server-side, and add parent-consent + trainer-routing tables. (Flagged in
`schema.sql`.)

---

## What I need from you to make Phase 0 yours

1. Your real daily routine (lifts, meals, film cadence).
2. **3–5 example texts in your actual voice** (this is what makes it feel personal).
3. A sample roster (name, position, parent contact).
4. Your position groups and how you bucket Offense / Defense / Special Teams.
5. A green light on the guardrails above.

---

## Roadmap (restaurant analogy)

- **Phase 0 — Hot dog stand (this):** voice → AI drop → check-ins → board. ✅
- **Phase 1 — One-employee restaurant:** assistant-coach seats per group, Brevo email + push,
  USDA-grounded nutrition (guardrailed), scheduling/RSVPs, Ask Coach bot, token-secure player API.
- **Phase 2 — Full restaurant:** parent portal + consent, streaks/analytics, "trending down" alerts,
  Hudl link-outs, multi-team athletic-department admin, autonomous nudging.

## Files
| File | What it is |
|---|---|
| `index.html` | Router/loader (handles player deep links) |
| `onboarding.html` | Coach signup → set voice → roster |
| `coach.html` | Dashboard: generate drop, send, accountability board, nudges, player links |
| `player.html` | Player check-in (opens from personal link, no login) |
| `config.js` | Supabase config, position groups, guardrails, local+Claude generator, data layer |
| `schema.sql` | Postgres schema + RLS |
| `supabase/functions/generate-daily/index.ts` | Claude Edge Function (key stays server-side) |
| `vercel.json`, `manifest.json`, `service-worker.js`, `offline.html` | Static + PWA plumbing |
