# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Despite the repo name (`askmyhandyman`), the product is **PrivateBlast** — a static PWA for private group-messaging aimed at nightlife professionals (entertainers, DJs, hosts, club owners). There is **no build step, no package.json, no test runner, no linter**. Every "page" is a self-contained HTML file with inline `<style>` and inline `<script>`, deployed as static assets to Vercel.

## Running and deploying

- **Local dev**: serve the directory with any static server (e.g. `python3 -m http.server 8000`, then open `http://localhost:8000/`). Opening files via `file://` will break the service worker and the absolute `/supabase-config.js` script tags.
- **Deploy**: pushed to Vercel using `vercel.json`, which serves every `.html`/`.js`/`.json` as static and routes `/` → `/index.html`. The only non-default headers are `Service-Worker-Allowed: /` and `Cache-Control: no-cache` for `/service-worker.js`.
- **There are no tests or linters.** Don't add a tooling layer without being asked.

## Architecture

### Page layout (each `.html` is a route)

| File | Purpose |
| --- | --- |
| `index.html` | Loader/router — checks Supabase session and redirects to `/app.html` or `/onboarding.html`. Also registers the service worker. |
| `onboarding.html` | Sign-up / sign-in / multi-step onboarding (role pick → privacy → plan → profile setup). Writes initial rows into `profiles`, `sub_profiles`, `groups`, `subscriptions`, and optionally `referrals` + `notifications`. |
| `app.html` | The main authenticated app (home, contacts, compose blast, tip jar, referrals, settings). ~1200 lines, biggest file in the repo. |
| `tracker.html` | Personal income tracker — `shifts` + `venues` tables. |
| `dj.html` | DJ-specific tracker view. |
| `owner.html` | Club owner dashboard for managing businesses; links into `club.html`. |
| `club.html` | Tip-out management for a club (`performers`, `performer_shifts`, `tip_out_rules`). |
| `offline.html` | Static fallback used by the service worker. |

Every authenticated page follows the same boot sequence: pull `supabase.auth.getSession()`, redirect to `/onboarding.html` if missing, then load data and render.

### Shared client config — `supabase-config.js`

This file is the single source of truth for shared frontend state and is included by every page **after** the Supabase UMD bundle:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/supabase-config.js"></script>
```

It exposes globals (no modules — everything is on `window`):
- `supabase` — the configured client. `SUPABASE_URL` and `SUPABASE_KEY` (anon) are hard-coded in this file.
- `ROLES` — 9 role definitions (`entertainer_f`, `entertainer_m`, `companion`, `wellness`, `creator`, `dj`, `host`, `talent`, `club`), each with an emoji, default `privacy` (`private`/`selective`/`open`), and a list of default groups (label + color) that onboarding seeds into the `groups` table.
- `PLANS` — pricing metadata for `free` / `basic` / `vip` / `business`.
- `PLAN_LIMITS` — the feature-gating matrix (contact count, group count, profile count, allowed media types, scheduling, tip jar tier, blacklist, club access, report ranges).
- Helpers: `generateReferralCode`, `getCurrentUser`, `getProfile`, `getSubscription`, `canAccess(plan, feature)`, `showUpgradeModal(featureName, requiredPlan)` — which injects a paywall sheet pointing at `billing.html` (note: that page does not yet exist in the repo).

When adding a new role or plan, update `ROLES` / `PLANS` / `PLAN_LIMITS` here **and** the `CHECK` constraints in `database-migration.sql`.

### Backend — Supabase

`database-migration.sql` is run manually in the Supabase SQL editor. It is the schema source of truth. Key facts:

- **15 tables**, all with **RLS enabled**. The dominant policy pattern is `auth.uid() = user_id` (or `owner_id` for club/owner-side tables: `tip_out_rules`, `performers`, `performer_shifts`). `blacklist` and `referrals` have special-case policies (community visibility / cross-user inserts).
- `profiles.id` is the same UUID as `auth.users.id` (1:1).
- `sub_profiles` lets one user run multiple personas. Most user-scoped data (`contacts`, `groups`, `blasts`) carries both `user_id` and `sub_profile_id`, and the app filters by the active sub-profile (see "Active sub-profile" below).
- `subscriptions` is keyed `UNIQUE (user_id)` — there's at most one row per user, mirroring `profiles.plan`.
- The role/plan/privacy enums are enforced by `CHECK` constraints; keep `supabase-config.js` in sync.

**When modifying the schema**: append idempotent (`IF NOT EXISTS` / `CREATE POLICY IF NOT EXISTS`) statements to `database-migration.sql`. There is no migration tool — the file is replayed by hand. Use the Supabase MCP tools (`list_tables`, `apply_migration`, `get_advisors`, `get_logs`) when you need to inspect or mutate the live project before editing the SQL file.

### Active sub-profile pattern

`app.html` stores the currently-selected sub-profile in `localStorage` as `activeProfileId` and adds `.eq('sub_profile_id', activeProfileId)` to every `contacts` / `groups` / `blasts` query when it's set. When you add a new feature that reads or writes any of those tables, follow the same pattern — otherwise the user will see data leaking across personas.

### Plan gating

Two layers, both client-side:
1. **`applyPlanGating()` in `app.html`** runs after `loadAll()` and toggles lock overlays / disables UI based on `PLAN_LIMITS[currentProfile.plan]`.
2. **Action handlers** re-check before performing the action and call `showUpgradeModal(...)` from `supabase-config.js` to block. Examples: contact-limit check around line 819, scheduled-send check around line 912, multi-profile check around line 1093.

Because gating is client-side only, **server-side enforcement (where it matters — e.g. preventing extra rows) must be added as RLS policies or DB constraints**, not just UI checks.

### PWA / service worker

`service-worker.js` (`CACHE_NAME = 'privateblast-v1'`) precaches the app shell listed in `PRECACHE_URLS`. **When you add a new top-level HTML page or change shared assets, add it to that array and bump the cache name**, otherwise returning users will hit the old version. The fetch handler explicitly **skips** `supabase.co`, `fonts.googleapis.com`, and `cdn.jsdelivr.net` so those always hit the network — don't try to cache Supabase responses here.

`manifest.json` is the PWA manifest; icons under `/icons/` are referenced but **not committed in this repo** (the directory does not exist) — if you need PWA install testing, create them.

## Conventions to preserve

- **No frameworks, no bundler, no JSX, no TypeScript.** Plain ES2017+ in inline `<script>` tags. Don't introduce React/Vue/etc. without explicit instruction.
- **No modules.** Cross-page sharing is done by attaching to `window` via `supabase-config.js`. If you need a new shared helper, add it there.
- **CSS lives inline** in each HTML file. The shared design tokens (custom-property palette beginning with `--bg:#06060d` and accent `--pu:#b496ff` / `--pk:#ff6eb4`) are duplicated at the top of each file — keep them in sync when changing the visual language.
- **Mobile-first, fixed 430px max-width** "phone column" layout (`.app { max-width: 430px }`). All pages assume portrait mobile.
- **Navigation between pages is full-page `window.location.href = '/foo.html'`** — no SPA routing.
- **Auth guard at the top of every authenticated page**: `await supabase.auth.getSession()` → redirect to `/onboarding.html` if absent. Copy this pattern into new pages.
- **Currency / decimals**: shift and tip-out columns use Postgres `decimal` with default `0`. Don't store money as `float`.

## Gotchas

- The repo name is `askmyhandyman` but nothing in the code refers to that — it's a leftover. All branding is "PrivateBlast".
- `supabase-config.js` contains live anon credentials in plain text. This is intentional (Supabase anon keys are public) but means **all access control depends on RLS being correct** — never disable RLS on a table, and always add a policy when you add a table.
- The `billing.html` referenced by `showUpgradeModal` does not exist yet; upgrade buttons currently navigate to a 404.
- `service-worker.js` does network-first for app HTML, so a redeploy is visible on the next reload — but only if the cache name was bumped or the URL was missing from `PRECACHE_URLS`.
