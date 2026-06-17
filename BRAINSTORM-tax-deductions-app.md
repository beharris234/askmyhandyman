# Brainstorm: A Tax Write-Off App for Working Business Owners

> Working title ideas: **WriteOff**, **DeductBuddy**, **TaxStash**, **Schedule C Sidekick**, **AskMyCPA**, **Keepr** (taken), **TaxSnap**.
> My pick: **WriteOff** (verb + noun, says exactly what it does) or **TaxStash** (the "stash" = your saved money + your stored receipts).

---

## The One-Line Pitch

**"Snap a receipt or ask a question, and instantly know what you can write off — built for the contractor, the store owner, and the repair guy, not the accountant."**

---

## 1. THE WHY (Why this needs to exist)

Small, "boots-on-the-ground" business owners — contractors, store owners, mechanics,
landscapers, salon owners — are **terrible at taxes through no fault of their own**:

- They're busy *doing the work*, not sitting at a desk doing books.
- They **overpay taxes every year** because they don't know what's deductible. The IRS
  estimates billions in missed deductions among small/self-employed filers annually.
- They **panic at tax time** with a shoebox of receipts and a stressed-out spouse.
- They're **scared of audits** so they under-claim to be "safe."
- Existing tools (QuickBooks, etc.) feel like **accounting software for accountants** — too
  many menus, too much jargon, monthly fees they resent.

The emotional core: **these owners don't want software. They want an answer.**
"Can I write this off — yes or no?" That's the product.

### Why NOW (instant demand drivers)
- **AI made the "ask a question, get a real answer" experience finally possible** and cheap.
  Three years ago you couldn't build the Q&A brain. Now you can.
- **1099 / gig + small-biz population keeps growing** — more first-time filers who are lost.
- **Tax law changes yearly** (brackets, mileage rates, Section 179 limits, bonus
  depreciation phase-outs). Owners can't keep up → recurring reason to open the app.
- **Phone cameras + cloud = receipt capture is trivial now.** No scanner needed.

---

## 2. THE WHO (Target user)

**Primary:** Owner-operators of small, service/retail businesses who file a **Schedule C**
or simple S-corp and have **little-to-no bookkeeping habit**. Think:

| Trade | Why they bleed money on taxes |
|---|---|
| General contractors / handymen | Tools, materials, truck, gas, subcontractors — huge deductible spend, zero tracking |
| Convenience / liquor / corner stores | Inventory, equipment, utilities, repairs, mixed personal/biz spend |
| Auto repair shops, mechanics | Parts, equipment, shop supplies, uniforms |
| Landscapers, cleaners, movers | Vehicle + equipment + labor heavy |
| Salons, barbers, nail techs | Booth rent, supplies, chair, training |
| Food trucks, caterers | Mileage, ingredients, permits, equipment |
| Real estate agents, independent drivers | Mileage is their #1 missed deduction |

**Psychographics:** mobile-first (lives on the phone, not a laptop), low patience for
jargon, often skeptical of "tech," values trust and plain talk, frequently
Spanish-bilingual households. **Design for someone covered in drywall dust checking the
app from their truck.**

**Secondary / expansion:** their spouse/partner (often the de-facto bookkeeper), and
their tax preparer (who could *receive* a clean year-end summary from the app).

---

## 3. THE WHAT (The product)

A **mobile-first app (PWA + native later)** with one promise: *make tax write-offs
effortless and answer any tax question in plain English.* Built around 5 pillars:

### Pillar 1 — "Ask Anything" Tax Assistant (the hook)
- Type **or talk** a question: *"Can I write off lunch with a client?"*, *"I bought a
  $4,000 trailer — how much can I deduct this year?"*, *"Is my truck insurance
  deductible?"*
- Get a **plain-English yes/no + the dollar logic + the IRS reason**, current to the
  filing year. Always with a "this isn't formal tax advice" line.
- This is the **viral, demo-able feature.** It's what makes people download.

### Pillar 2 — Snap & Sort (receipt/photo capture)
- Take a photo of a receipt, invoice, or bill. AI reads it (OCR), auto-categorizes it
  into the right **Schedule C line** (e.g., "Supplies," "Car & Truck"), and tells you
  **how much is deductible**.
- Upload PDFs/documents (insurance bills, lease, 1099s) and have them filed and tagged.
- **Voice memo option:** "Just paid Mike $300 cash to help on the Johnson job" → logged
  as contract labor.

### Pillar 3 — The Running Summary (the "shoebox killer")
- A live **year-to-date deduction total**: *"You've tracked $14,320 in write-offs —
  roughly $3,400 in tax savings so far."* (The savings number is the dopamine.)
- Breakdown by category, by month, by job/project.
- **Mileage tracking** (auto or quick-log) — biggest single missed deduction for this crowd.

### Pillar 4 — Year-End Export ("Hand this to your CPA")
- One tap generates a clean, categorized **Schedule C summary PDF/CSV** the owner can
  hand to their tax preparer or drop into TurboTax.
- This is the moment they realize the app saved them real money → renewal + word of mouth.

### Pillar 5 — Yearly Refresh (your recurring moat)
- Every January the app updates: new mileage rate, new Section 179 limits, new brackets,
  new credits. Push notification: *"3 new write-offs available to your trade in 2027."*
- This justifies the **subscription** and keeps churn low.

---

## 4. EIGHT+ PAIN POINTS IT SOLVES (your "7-8" requirement)

1. **"I don't know what's deductible."** → Ask Anything + trade-specific deduction lists.
2. **"I lose my receipts."** → Snap & Sort, stored forever in the cloud.
3. **"Taxes stress me out / I procrastinate."** → Running summary makes it a 10-sec daily habit.
4. **"I'm scared of an audit."** → Every deduction has a stored receipt + an IRS-reason note → audit-ready.
5. **"I overpay every year."** → Live tax-savings counter shows money found.
6. **"Accounting software is too complicated/expensive."** → No ledgers, no jargon, one screen.
7. **"My books are a mess at tax time."** → One-tap CPA-ready year-end export.
8. **"Tax rules keep changing."** → Yearly auto-refresh + alerts.
9. **(Bonus) "I mix personal and business spending."** → Quick "business / personal / split" tag on each expense.
10. **(Bonus) "I forget mileage."** → Auto/quick mileage logging — pure found money.

---

## 5. COMPETITORS — THE HONEST TRUTH (and your wedge)

You asked to make sure there are no competitors. **There are competitors — but not for
*your* exact customer or *your* exact experience.** Here's the landscape:

| Competitor | Who it's really for | Their weakness = your opening |
|---|---|---|
| **Keeper** (~$49/mo or $349/yr) | Solo freelancers/gig workers; bank-sync auto-scan | Built around linking a bank account; freelancer-coded; not trade/store owners |
| **FlyFin** (~$95–149/yr) | Gig workers, 1099s; AI + CPA review | Generic; not blue-collar; jargon-y; assumes desk worker |
| **Hurdlr** | Rideshare/delivery drivers | Mileage-first; weak on "what's deductible" Q&A |
| **QuickBooks Self-Employed** (~$20/mo) | Anyone, but it's full accounting | Too complex, feels like accounting homework, Intuit churns it |
| **Everlance** | Mileage + expense for sales/gig | Mileage-centric, not a tax-knowledge tool |

### Your differentiation (the 5 things none of them nail together)
1. **Q&A-first, not bank-sync-first.** They want you to link a bank account (scary, friction).
   You let someone get value in 10 seconds by *asking a question* — no setup.
2. **Built for trades & brick-and-mortar, not "freelancers."** Trade-specific deduction
   packs ("Contractor mode," "Store Owner mode," "Salon mode") with the exact write-offs
   *their* trade misses. Nobody segments like this.
3. **Plain talk + voice + bilingual.** The competitors are written for laptop people.
   You're built for a phone in a work truck, including Spanish.
4. **Photo/voice capture without a bank.** Cash economy friendly — huge for trades and stores.
5. **The "savings counter" + yearly refresh** as the emotional + recurring hook.

> **Bottom line:** Don't claim "no competitors" — that signals you haven't looked, and
> investors/partners will distrust it. Claim instead: *"A crowded freelancer-tax market
> that has completely ignored the 30M+ trade and small-retail owners who hate accounting
> apps and just want a plain answer."* That's a sharper, more credible story.

---

## 6. MONETIZATION

- **Freemium hook:** Free = ask X questions/month + track up to N receipts. Removes the
  "why should I pay before I see value" objection.
- **Pro subscription:** ~**$8–15/mo or $79–99/yr** (undercut Keeper/QBSE; price for a
  budget-conscious trade owner). Unlimited Q&A, unlimited capture, mileage, year-end export.
- **Tax-season upsell:** "CPA review" / "file with us" add-on (partner with a tax-prep
  service for revenue share) — this is where FlyFin/Keeper make real money.
- **B2B2C channel:** sell to **trade associations, franchises, and CPAs** who give it to
  their members/clients (sticky, low-CAC distribution).

---

## 7. MVP — WHAT TO BUILD FIRST (to test demand fast)

Don't build everything. Prove the hook first:

**Phase 1 (MVP, ~weeks):**
1. **Ask Anything** chat (this is 80% of the wow) — AI answers tax-deduction questions,
   current-year, plain English, with disclaimer.
2. **Snap a receipt** → AI reads + categorizes + stores.
3. **Running YTD summary** with the **estimated tax-savings counter**.

That's a demo that gets people to say "I'd download that." Everything else (mileage,
exports, trade packs, bank sync) is Phase 2+.

**Tech note:** You already have a Supabase + static-PWA setup in this repo. That stack is
a great fit — Supabase for auth/storage/DB, an LLM API for the Q&A brain, phone-camera
upload to Supabase Storage, and an OCR step on receipts. I can scaffold this when you're ready.

---

## 8. RISKS / THINGS TO GET RIGHT

- **"This is not tax advice" must be everywhere.** You're an *organizer + educator*, not a
  filer/CPA. Keep that line clean to avoid liability. (Real CPA review = a paid partner.)
- **AI accuracy on tax law.** Ground answers in a curated, yearly-updated rules source —
  don't let the model freestyle on dollar limits. Cite the IRS reason.
- **Trust.** Blue-collar owners are skeptical of apps. Lead with social proof from people
  who look like them, not slick fintech vibes.
- **Yearly maintenance is the real work.** The moat (annual updates) is also the
  obligation. Budget for it every December/January.

---

## 9. NEXT STEPS (pick one)

- **A.** Validate demand: I draft a 1-page landing page ("Ask any tax write-off question
  free") + a short survey to put in front of 20 trade owners. Cheapest way to prove it.
- **B.** Build the MVP Ask-Anything + receipt-snap prototype on your existing Supabase/PWA stack.
- **C.** Go deeper on a specific trade first (e.g., **Contractors only**) to dominate one
  niche before expanding.

My recommendation: **A then B.** Prove people want the answer before you build the whole brain.

---

### Sources (competitor & market grounding)
- [Keeper / FlyFin / Hurdlr / QuickBooks Self-Employed comparison — ZipDo](https://zipdo.co/best/self-employed-tax-software/)
- [Best tax-deductible expense tracker apps 2026 — Finny](https://getfinny.app/blog/best-tax-deductible-expense-tracker-apps)
- [25 Small Business Tax Deductions 2026 — FreshBooks](https://www.freshbooks.com/hub/expenses/tax-deductions-small-business)
- [25 Self-Employed Tax Write-offs 2026 — Everlance](https://www.everlance.com/blog/self-employment-tax-deductions)
- [19 Tax Deductions for Independent Contractors 2026 — Deel](https://www.deel.com/blog/common-tax-deductions-for-independent-contractors/)
