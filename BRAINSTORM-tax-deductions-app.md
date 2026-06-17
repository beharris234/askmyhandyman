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

### Pillar 6 — Lease vs. Buy Advisor (the high-dollar decision tool)
The biggest tax decision these owners make isn't a $40 receipt — it's a **$40,000 truck,
a $15,000 trailer, an excavator, or a walk-in cooler.** Almost none of them run the math,
and getting it wrong costs thousands. The app should advise: **should you lease it or
buy it?**

**How it works (a 5-question wizard, not a spreadsheet):**
1. *What is it and what does it cost?* (truck / equipment / tool — $ price)
2. *Buy outright, finance, or lease?* (and the monthly payment if known)
3. *How long will you use it?* (3 yrs? 10 yrs? until it dies?)
4. *Roughly what's your tax bracket / business income?*
5. *How's your cash right now?* (tight / comfortable)

**What it gives back — a plain-English recommendation with the dollar logic:**
- **The tax angle:** Buying may let you **write off most/all of it this year** via
  **Section 179** or **bonus depreciation** (huge first-year deduction). Leasing is
  **deductible as you pay** (smooth, smaller deductions over time). The tool shows the
  **year-1 vs. multi-year deduction difference in real dollars.**
- **The cash-flow angle:** Lease = low money down, preserve cash, but you own nothing.
  Buy = big cash out (or loan + deductible interest), but you build an **asset you own**
  and can sell later.
- **The verdict:** *"For your situation — high income this year, you'll keep this truck
  8+ years, and you have the cash — **buy it and take the Section 179 deduction.** It
  saves you ~$X this year vs. leasing."* Or the opposite for a cash-tight owner who
  upgrades trucks every 3 years → **lease.**

**Why this is a killer feature:**
- It's the **single highest-dollar piece of advice** in the whole app → biggest "this app
  paid for itself" moment.
- **No competitor offers a tax-aware lease-vs-buy tool for this crowd** — it's usually
  buried in a CPA conversation the owner never has.
- It's a natural **tax-season + equipment-buying-season** re-engagement hook ("Thinking
  about a new truck? Run the numbers first.").
- Easy upsell to a **"talk to a CPA before you sign"** paid review on big-ticket items.

> Keep the disclaimer tight: this is a **decision aid / estimate**, not formal tax advice —
> and big purchases ("should I really spend $40k?") should nudge toward the CPA review.

### Pillar 7 — Credits, Depreciation & "Found Money" from Prior Years
Deductions reduce your *income*; **credits reduce your *tax bill dollar-for-dollar*** — they're
worth far more, and owners almost never know which ones they qualify for. On top of that,
**big assets keep giving deductions for years** (depreciation), and **you can often go back
and fix missed deductions/credits on past returns for an actual refund check.** This pillar
chases all three.

**A. Tax-credit finder (most missed money)**
- A short profile + Q&A surfaces credits the owner likely qualifies for, e.g.: hiring
  credits (Work Opportunity), retirement-plan startup credits, health-coverage credits,
  energy/EV and clean-vehicle credits, R&D for some trades, accessibility credits, and
  education/training credits.
- Plain-English: *"You may qualify for a $X credit for the new HVAC/EV/solar — that's
  $X straight off your tax bill, not just a deduction."*

**B. Long-term depreciation tracker (the multi-year deduction)**
- When they buy a big asset (truck, equipment, building improvement), the app sets up the
  **depreciation schedule** and **reminds them every year** of the deduction they still get
  — so it's never forgotten.
- Pairs with the Lease-vs-Buy advisor: *"Take it all now (Section 179) or spread it over
  5–7 years (depreciation)?"* — and shows which is smarter given their income trend.

**C. Prior-year refund finder (the "found money" hook)**
- Walks the owner through the last **up to 3 tax years** asking what they *didn't* claim —
  missed mileage, home office, equipment, supplies, credits, etc.
- Estimates a potential **refund from amending** those returns (IRS Form 1040-X) and flags:
  *"You may be owed ~$X from 2024 — here's how to claim it."*
- **Critical guardrail:** there's generally a **~3-year window** to amend for a refund, and
  amended returns should be **filed/reviewed by a tax pro.** The app finds and estimates the
  money; it then **hands off to the CPA review** to actually file it (paid upsell + safety).

**Why this is powerful:**
- **Credits + back-refunds = the biggest "this app just found me real money" moments** — far
  bigger than a single receipt. Great for testimonials and word-of-mouth.
- It's a **reason to subscribe immediately** ("let's see if you're owed money from last year")
  instead of waiting to accumulate value.
- Natural **paid CPA-review upsell** on anything that requires actually amending a return.

---

## 3.5 MISSING / UNDISCOVERED COMPONENTS (the layer beyond the visible features)

The pillars above are *what the user sees*. But a real tax app for these owners needs a
deeper layer that decides whether they actually save money and stay out of trouble. These
are the candidate components still being figured out — split into **game-changers**
(strategic, money-moving) and **table-stakes** (mandatory or the app feels broken).

### Game-changers (the big "aha" pieces)
- **Quarterly estimated taxes.** The #1 thing that wrecks self-employed owners — they skip
  quarterly payments, then face a huge April bill + penalties. App auto-calculates *"set
  aside $X, due [date]"* every quarter. Worth the subscription by itself.
- **Entity structure advisor (LLC vs. S-corp).** The single biggest legal tax lever. Past
  ~$60–80k profit, an **S-corp election** can save thousands/yr in self-employment tax.
  *"You're leaving ~$6,000/yr on the table by not being an S-corp."*
- **Business bank account + debit card (fintech wedge).** Money flowing through *our* card
  means **every expense auto-categorizes** (receipts become backup, not a chore), **auto-
  separates business vs. personal**, and unlocks the **real revenue model** (interchange +
  float) beyond subscriptions. Possibly the whole business. (See Found, Lili, Novo.)
- **Human CPA layer.** Owners ultimately want a *person* to trust. A "tap to connect with a
  vetted tax pro" marketplace — for amended returns, S-corp filing, audits — is the trust
  anchor and the richest upsell.

### Table-stakes (mandatory or it feels broken)
- **Sales tax** — critical for *store owners* (collect + remit; totally different from
  income tax). Easy to forget since contractors don't deal with it.
- **Tax calendar & deadline reminders** — quarterly dates, 1099 deadline, annual return.
- **Paying workers** — 1099 vs. W-2, issuing 1099s to cash labor, reporting thresholds.
- **Audit protection / defense** — receipt-backed trail + paid audit-support add-on.
- **Multi-user access** — spouse/bookkeeper and the accountant need a way in.
- **Peer benchmarking** — *"stores like yours deduct $X in utilities"* → flags misses, builds trust.

> **Open question to resolve:** which of the game-changers is the *core* of the product?
> A "tax answer app" (Q&A + capture) and a "business banking app" (card + auto-categorize)
> are two very different companies. Pick the spine before building.

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
11. **"Should I lease or buy this truck/equipment?"** → Lease vs. Buy Advisor runs the
    tax + cash-flow math and gives a plain verdict before they sign — the highest-dollar
    decision in their year.
12. **"What tax credits do I qualify for?"** → Credit finder surfaces dollar-for-dollar
    credits (hiring, retirement, energy/EV, etc.) owners never knew existed.
13. **"I forgot to claim stuff on past returns."** → Prior-year refund finder reviews up to
    3 past years, estimates money owed, and routes an amended return to a CPA — found money.
14. **"I lose track of multi-year write-offs."** → Depreciation tracker reminds them each
    year of the deduction a big purchase still owes them.

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
