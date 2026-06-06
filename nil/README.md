# NILocal — local-first NIL marketplace (MVP)

**Local brands. Campus athletes. Real deals.**

NILocal connects local businesses with nearby college athletes for simple, affordable
NIL deals — social posts, appearances, autograph signings, clinics. It targets the gap
the big platforms (On3, Opendorse, INFLCR) ignore: small/local deals, women's & Olympic
sports, and mid-major schools.

This is a **zero-dependency static web app** — pure HTML/CSS/JS. No build step. It deploys
free on Vercel/Netlify/GitHub Pages and works out of the box.

> Note: this `nil/` folder is **self-contained and separate** from the PrivateBlast app in
> the repo root. Nothing here touches that app.

---

## What's included

| File | Purpose |
|------|---------|
| `index.html` | Landing page — pitch, how-it-works, two audiences, pricing, CTAs |
| `athletes.html` | Browsable athlete directory (search + filter by sport/school/city/price) |
| `for-athletes.html` | Athlete signup form (free profile) |
| `for-business.html` | Business signup / deal-request form |
| `nil-config.js` | Data layer — Supabase wiring + demo fallback + CSV export |
| `nil.css` | Shared styles |
| `nil-schema.sql` | Supabase tables + row-level security |
| `vercel.json` | Deploy config |

---

## Two modes

**Demo mode (default — works immediately, $0, no setup).**
Leave the credentials in `nil-config.js` blank. The directory shows seed athletes and every
signup is saved to the visitor's browser. Use it to demo the product and collect early
signups, then export them:

```js
// In the browser console on any NILocal page:
NIL.exportCSV('nil_demo_athletes')    // downloads athlete signups
NIL.exportCSV('nil_demo_businesses')  // downloads business leads
```

**Live mode (real signup capture — still free on Supabase's free tier).**
1. Create a free project at [supabase.com](https://supabase.com).
2. SQL Editor → paste & run `nil-schema.sql`.
3. Settings → API → copy your **Project URL** and **anon public key**.
4. Paste them into the top of `nil-config.js`:
   ```js
   const SUPABASE_URL = 'https://YOURPROJECT.supabase.co'
   const SUPABASE_KEY = 'eyJhb...your-anon-key...'
   ```
5. Redeploy. Signups now land in your database. New athletes are hidden from the public
   directory until you flip `approved = true` on their row (Table editor → toggle).

---

## Deploy in 5 minutes (free)

**Option A — Vercel (recommended):**
1. Push this repo to GitHub (already done if you're reading this on the branch).
2. [vercel.com](https://vercel.com) → New Project → import the repo.
3. Set **Root Directory** to `nil`.
4. Deploy. You get a free `*.vercel.app` URL. Add a custom domain later for ~$12/yr.

**Option B — Netlify drop:** drag the `nil/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

**Run locally:** `cd nil && python3 -m http.server 8080` → open http://localhost:8080

---

## Zero-budget go-to-market (the launch part)

Don't chase "the masses." Win **one campus / one city** first.

1. **Pick a beachhead** — one school, lean into women's + Olympic + mid-major (ignored by everyone else).
2. **Recruit 10 athletes by hand** — DM them, use team group chats / SAAC / a friendly coach. Offer to find them a paid local deal.
3. **Recruit 5 local businesses** — walk into gyms, smoothie shops, barbers, dealerships near campus. "I'll connect you with [School] athletes for $X, pay only if you like it."
4. **Broker 3 real deals manually** — you're the concierge before the software scales.
5. **Turn deals into content** — film every deal, post Reels/TikToks. The deals *are* the marketing ($0).
6. **Be the local-NIL media voice** — "who got paid this week" at your school → inbound athletes & businesses.

Goal for week 1: profiles live, link shared, first deal in motion.

---

## Roadmap (after first deals)

- In-app deal booking + escrow payments (Stripe Connect) → that's where the 10–20% fee turns on
- Athlete dashboard (deal tracking, tax estimate, contracts)
- Verified deal amounts (the transparency wedge)
- Geo search / map, ratings, automatic matching

## Compliance note
NIL rules vary by school and state. NILocal records deals for transparency, but athletes and
businesses are responsible for following their institution's and state's NIL policies.
