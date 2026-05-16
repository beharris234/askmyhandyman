# VA Disability Rating Decoded — Full Project Plan

**Status:** Pre-build planning doc. No code yet.
**Owner:** Anonymous veteran founder
**Target:** $1,000/day revenue in 5–8 months
**Time commitment:** 1–2 hours/day
**Last updated:** 2026-05-16

---

## 1. Executive Summary

A faceless, AI-agent-operated digital education business serving US military veterans navigating the VA disability rating system. Revenue comes from a single $147 digital workbook plus self-serve affiliate offers layered into the email sequence. Traffic comes from daily faceless short-form video (TikTok, YouTube Shorts, Instagram Reels) and a small paid-ad test budget. AI agents handle product research, content production, posting, email nurture, affiliate rotation, and analytics. The founder reviews output, approves content, and makes weekly direction calls — no phone outreach, no public persona, no team.

**Why this can work:** the VA disability information space has massive search and social demand, the niche is underserved by professional educational products (most content is fragmented blog posts or accredited-attorney lead-gen), and a single $147 product needs only 7 sales/day to clear $1,000/day gross.

**Why it might not:** product quality bar is high (veteran communities police bad info hard), TikTok algorithm risk is real, and the founder must execute consistently for 5–8 months before revenue stabilizes.

---

## 2. Locked Constraints

| Constraint | Implication |
|---|---|
| No phone outreach, no email outreach to firms | Cannot access $50–$500/lead law firm affiliate programs. Self-serve affiliates only. |
| Founder remains anonymous (no face) | Faceless video, no personal brand, brand identity must do the trust-building |
| Veteran-owned (private knowledge only) | Internal credibility for partners, not displayed publicly |
| ~$500 ad test budget | Cannot buy traffic at scale; organic short-form must do the heavy lifting |
| 1–2 hours/day founder time | All non-judgment work must be AI-automated |
| Will build one digital product | Margin lever that makes the math work |

---

## 3. The Product

### Name
**VA Disability Rating Decoded** (working title — final name decided in Week 1 after domain availability check)

### Price
**$147 USD** — sweet spot between impulse and premium. Justifies money-back guarantee, sits below the "needs a sales call" threshold (~$300+), high enough that ~7 sales/day = $1K/day.

### Format
- Digital PDF workbook (~120–180 pages)
- Companion Excel/Google Sheet: Combined Ratings Calculator
- Fillable PDF templates (personal statement, buddy statement, evidence checklist)
- Optional video walkthrough of each module (AI voiceover)
- Delivered via Gumroad or Stan Store (no custom checkout to build)
- Lifetime updates as VA regulations change

### Module outline (v1)

| # | Module | Why it sells |
|---|---|---|
| 1 | How the VA Rating System Actually Works | Most vets don't understand combined ratings math. This alone is worth $147. |
| 2 | The Five Evidence Pillars | What evidence wins, what doesn't, why claims get denied |
| 3 | Reading Your Decision Letter | Decoding the language, finding what to challenge |
| 4 | Supplemental Claims, Higher-Level Reviews, and Appeals | The three lanes after a denial, when to use each |
| 5 | TDIU Eligibility Deep Dive | Total Disability Individual Unemployability — often missed, can mean 100% pay |
| 6 | Secondary Conditions Playbook | How one service-connected condition unlocks others (sleep apnea, mental health, etc.) |
| 7 | When to Upgrade Your Rating (and When Not To) | Protecting protected ratings, when re-opening risks downgrade |
| 8 | PACT Act Presumptive Conditions Reference | All 23+ presumptive conditions, filing pathway, evidence requirements |
| Bonus | Personal Statement template, Buddy Statement template, Evidence Checklist, C&P Exam Prep | High-perceived-value templates |

### Source material (legitimate, public-domain)
- 38 CFR Part 4 (Schedule for Rating Disabilities)
- 38 CFR §14.626–637 (Accreditation rules)
- M21-1 Adjudication Procedures Manual (VA's internal manual, public)
- BVA (Board of Veterans' Appeals) decisions database
- CAVC (Court of Appeals for Veterans Claims) precedential decisions
- VA.gov official content
- Federal Register entries on PACT Act implementation

### What this product is NOT
- Not legal advice
- Not claim assistance (we don't fill out forms for anyone)
- Not representation
- Not a guarantee of any rating outcome
- Not affiliated with VA, DoD, or any government entity

Every page, every email, every video carries this disclaimer.

---

## 4. Legal & Compliance (READ TWICE)

This is the single biggest risk in the entire project. **38 CFR §14.626–637** restricts who can assist a claimant in preparing, presenting, or prosecuting a claim before the VA. Only:
- VA-accredited attorneys
- VA-accredited claims agents
- VA-recognized Veterans Service Organization (VSO) representatives

…can do that work for compensation. Violating this is a federal matter.

### What we CAN do (legally clear)
- Sell educational materials explaining how the VA system works
- Reference public regulations, manuals, and case decisions
- Provide templates and checklists for self-help
- Share general information about presumptive conditions, rating schedules, and procedures
- Make affiliate referrals to accredited representatives (when those programs become available later)

### What we CANNOT do
- Fill out forms for a specific veteran
- Review a specific veteran's file and advise on their claim
- Imply we can get a higher rating
- Use the word "guarantee" in any outcome context
- Use phrases like "we help you file" or "our experts review your claim"
- Charge any veteran for individualized advice
- Use VA, DoD, or any service branch logo or implied endorsement

### Required disclaimers (every page, every email, every video description)
> This material is for educational purposes only. It is not legal advice and does not constitute representation in a VA claim. Only VA-accredited attorneys, claims agents, and VSO representatives are authorized to assist with VA claims for compensation under 38 CFR §14.626–637. Always consult an accredited representative for your specific situation. We are not affiliated with the Department of Veterans Affairs.

### Money-back guarantee
30 days, no questions asked. Required for:
1. Trust in a niche where scams are common
2. Reducing refund-driven complaints in vet communities
3. Faster Stripe/Gumroad approval

---

## 5. The Funnel

```
        SHORT-FORM VIDEO (TikTok / YT Shorts / Reels)
                          |
                          v
              "Link in bio" → landing page
                          |
                          v
          FREE LEAD MAGNET: "The 7 Mistakes That
          Cost Veterans Their VA Rating" (12-page PDF)
                          |
                          v
              Email opt-in (Supabase + Resend)
                          |
                          v
        ============ EMAIL SEQUENCE ============
        Day 0:  Lead magnet delivery + welcome
        Day 1:  Education email (rating math)
        Day 2:  Education email (evidence pillars)
        Day 3:  Soft pitch — product introduced
        Day 4:  Affiliate offer (e.g., SoFi refi)
        Day 5:  Story-based pitch
        Day 7:  Hard pitch + limited-time bonus
        Day 10: Affiliate offer (e.g., Trust & Will)
        Day 14: Final pitch + scarcity
        Day 21+: Long-term nurture (weekly value email)
        =========================================
                          |
                          v
                $147 PRODUCT PURCHASE (Gumroad)
                          |
                          v
              Customer onboarding sequence
                          |
                          v
          Affiliate upsells in post-purchase email
          (VA loan refi, GovX, BetterHelp, etc.)
```

### Conversion benchmarks to design for
| Stage | Realistic | Aspirational |
|---|---|---|
| Video view → bio click | 1–3% | 5% |
| Bio click → email opt-in | 25–40% | 50% |
| Email subscriber → product buyer | 2–5% | 8% |
| Product buyer → affiliate click | 30% | 50% |
| Affiliate click → conversion | 2–10% (varies wildly by program) | — |

**Math at realistic numbers:** 10,000 video views/day × 2% bio click × 30% opt-in × 3% buyer = 1.8 buyers/day = $264/day from product alone. Add affiliates and you're at $300–$400/day. To hit $1K/day, scale to ~30,000 video views/day, which is reachable with a 90+ video library and consistent daily posting.

---

## 6. The AI Agent Team

Ten agents. Each one has a single job, runs on a schedule, and either produces output for you to approve or executes autonomously inside guardrails.

| # | Agent | Job | Runs | Your involvement |
|---|---|---|---|---|
| 1 | **Product Research Agent** | Pulls 38 CFR, M21-1, BVA decisions, Reddit pain points. Builds chapter drafts. | Weeks 1–3, then ad-hoc | Heavy — fact-check everything |
| 2 | **Hook Miner** | Scrapes top-performing veteran TikToks/Shorts daily. Extracts winning hook patterns + trending topics. | Daily | None — feeds Agent 3 |
| 3 | **Script Writer** | Generates 5–10 video scripts/day from Hook Miner output + product themes. | Daily | Light — approve/reject scripts in batch |
| 4 | **Video Assembler** | Pairs approved script with ElevenLabs voiceover + stock B-roll (Pexels API) + Canva captions. Outputs MP4. | Daily | Spot-check first 5 per week |
| 5 | **Posting Agent** | Auto-posts to TikTok, YT Shorts, Instagram Reels with platform-optimized titles + hashtags. | 3× daily | None |
| 6 | **Comment Responder** | Replies to comments using approved tone/personas. Flags DMs that need human review. Drives traffic to bio link. | Continuous | Review flagged DMs daily |
| 7 | **Email Nurture Agent** | Runs the behavioral sequence above. Segments subscribers by behavior (opens, clicks, purchases). Drafts weekly broadcast emails. | Triggered + weekly | Approve weekly broadcasts |
| 8 | **Affiliate Link Manager** | Rotates self-serve affiliate offers across emails and site placements. Tracks EPC by offer. Pauses losers, scales winners. | Daily | None |
| 9 | **Analytics Dashboard Agent** | Pulls TikTok, YouTube, Resend, Gumroad, Supabase, and affiliate dashboards. Sends daily Slack/email digest. | Daily | Read digest in 2 minutes |
| 10 | **Iteration Agent** | Weekly: identifies top-performing videos, top-converting email subject lines, top affiliate offers. Drafts next week's experiments. | Weekly | Approve experiment list |

### Build order for agents
Weeks 5–6: Agents 1, 7, 8 (need them for funnel launch)
Weeks 6–7: Agents 2, 3, 4, 5 (content engine)
Week 8: Agents 6, 9, 10 (operations layer)

---

## 7. Tech Stack

### Already have
- Claude (content + agent brains)
- Gemini (second opinion / cross-check)
- Genspark (research + AI search)
- Supabase (DB + auth + edge functions for agents)
- Canva (graphics, video captions, lead magnet PDF design)

### Add (cheap or free, in order of need)

| Tool | Purpose | Cost |
|---|---|---|
| Domain (Namecheap) | Brand URL | ~$12/yr |
| Vercel (free tier) | Hosting landing + product pages | Free |
| Gumroad **or** Stan Store | Product checkout + delivery | Free + 10% per sale |
| Resend (free tier) | Transactional + nurture email | Free up to 3K/mo, then $20/mo |
| ElevenLabs | AI voiceover for videos | Free 10K chars/mo, $5/mo for more |
| Pexels API | Stock B-roll footage | Free |
| CapCut (or Submagic) | Video editing + captions | Free / $16/mo |
| TikTok, YouTube, Instagram | Distribution | Free |
| Beehiiv (alternative to Resend) | If newsletter strategy expands | Free up to 2.5K subs |
| Google Search Console + Bing Webmaster | Free SEO baseline | Free |
| Plausible or Umami | Privacy-friendly analytics | Free (self-hosted) or ~$9/mo |

**Total monthly run cost months 1–3:** ~$0–$40
**Total monthly run cost month 6+ at scale:** ~$80–$150

---

## 8. Self-Serve Affiliate Programs (Sign Up Week 4)

All accept applications via web form. No calls, no relationships required.

| Program | Network | Typical payout | Vet relevance |
|---|---|---|---|
| **Veterans United Network** | Impact Radius | Varies, generous | VA home loans — perfect fit |
| **NewDay USA** | Impact / direct | $50–$200/lead | VA home loans |
| **Rocket Mortgage** | Impact | Per-funded-loan | VA loan option |
| **SoFi** | Impact | $75–$300/account | Refi, banking, investing — vets care about all three |
| **Trust & Will** | Impact | $20–$50/sale | Estate planning, vets are underserved |
| **GovX** | FlexOffers / direct | 5–10% commission | Military discount marketplace |
| **BetterHelp** | FlexOffers / direct | $100+/sign-up | Mental health, big vet concern |
| **Audible** | Amazon Associates | $5–$15/trial | Vet biographies, leadership books |
| **Coursera / Udemy / LinkedIn Learning** | CJ Affiliate | Varies | Transition / career training |
| **Robinhood / Public.com** | Various | $5–$30/funded account | Vets investing GI Bill / disability income |
| **Rocket Money** | Impact | $5–$30/signup | Vets watching budget |
| **LegalZoom** | CJ Affiliate | $15–$50/sale | LLC formation for vet entrepreneurs |
| **Bluehost / Hostinger** | CJ Affiliate / direct | $65–$150/sale | Vets starting online businesses |
| **Amazon Associates** | Amazon | 1–10% | Tactical gear, vet books, supplements |

**Strategy:** apply to 8–10 in Week 4. Get approved for 5–7. Start with the 3 highest-EPC offers in email rotation. Let Agent 8 (Affiliate Link Manager) reshuffle based on actual data after 30 days.

---

## 9. Marketing / Content Strategy

### Why short-form video first
- Algorithmic discovery (no SEO ramp-up needed)
- 1 viral video can do what 6 months of SEO does
- Faceless format is widely accepted on TikTok/Shorts
- Veterans actively consume military/benefits content on all three platforms

### Content pillars (5 video types, rotate daily)

| Pillar | Example title | Goal |
|---|---|---|
| **Shock fact** | "Most veterans don't know this VA rating math trick" | Stop scroll |
| **Mistake reveal** | "The #1 reason VA disability claims get denied" | Build authority |
| **News tie-in** | "Big PACT Act update just hit — who qualifies now" | Ride trending topics |
| **Listicle** | "5 secondary conditions every vet with PTSD should know about" | High saves, high shares |
| **Storytelling** | "He had a 30% rating. Here's how he got to 100%." | Emotional + product setup |

### Posting cadence
- 3 videos/day to TikTok
- 3 videos/day to YouTube Shorts (same files)
- 3 videos/day to Instagram Reels (same files)
- = 9 posts/day from 3 unique videos
- Goal by Week 12: 90+ video library, 50K+ followers across platforms

### Hashtag strategy
Mix of 3–5 hashtags per post:
- Niche: #vadisability #pactact #veterancompensation #vaclaim
- Broad: #veterans #military #usmilitary
- Trending: rotate based on TikTok Discover daily

### Engagement
Comment Responder Agent (Agent 6) replies to every comment within ~15 minutes. Pins the best comment on each video pointing to bio link.

### SEO content layer (starts month 3)
Once funnel is converting, layer in long-form written content for compounding organic traffic:
- Pillar pages: each module of the product gets a public companion article
- Long-tail blog posts: "Can I get VA disability for [condition]?" pattern
- Calculator tools: free Combined Ratings Calculator as link-bait

---

## 10. 8-Week Build Timeline

| Week | Focus | Deliverables | Your hours |
|---|---|---|---|
| **1** | Research + foundation | Domain chosen + bought. Brand name locked. Product outline finalized. Gumroad/Stan Store account created. Compliance disclaimer drafted. | 8–10 |
| **2** | Product writing (Modules 1–4) | Claude drafts, you fact-check against 38 CFR + M21-1. ~60 pages done. | 8–10 |
| **3** | Product writing (Modules 5–8 + bonuses) | Remaining ~80 pages. Templates designed in Canva. Combined Ratings Calculator built in Google Sheets. | 8–10 |
| **4** | Funnel build | Landing page (Vercel). Email opt-in (Supabase + Resend). Lead magnet PDF designed. Apply to 8–10 affiliate programs. | 6–8 |
| **5** | Email sequence + agents 1, 7, 8 | 14-day email sequence written + scheduled. Email Nurture Agent live. Affiliate Link Manager live. | 6–8 |
| **6** | Video engine (agents 2, 3, 4) | Hook Miner running. Script Writer producing 5/day. Video Assembler outputting MP4s. First 30 videos batched. | 8–10 |
| **7** | Distribution + ads (agent 5) | Posting Agent live on all 3 platforms. Daily posting begins. $20/day ad test starts on TikTok or Facebook. | 5–7 |
| **8** | Ops layer (agents 6, 9, 10) | Comment Responder live. Analytics Dashboard sending daily digest. Iteration Agent doing weekly reviews. **Soft launch complete.** | 4–6 |

**Total founder time over 8 weeks:** ~55–75 hours. ~1 hr/day average.

---

## 11. Success Metrics & Checkpoints

| Checkpoint | Target | Stop & rethink if… |
|---|---|---|
| **End of Week 4** | Product 100% done, funnel live | Product not done — extend by 2 weeks |
| **End of Week 8** | 500+ followers across platforms, 50+ email subs, first sale | Zero email subs — funnel is broken, audit landing page |
| **End of Month 3** | 5K+ followers, 1K+ email subs, $500–$2K/month revenue | <$200/month — product or offer mismatch, iterate |
| **End of Month 5** | 25K+ followers, 5K+ subs, $5K–$15K/month | <$2K/month — pivot product positioning |
| **End of Month 8** | 50K+ followers, 15K+ subs, **$25K–$35K/month ($1K/day)** | <$10K/month — flex one more constraint (likely: outreach or bigger ad budget) |

### Daily metrics dashboard (Agent 9 reports)
- Video views (24h, by platform)
- Bio link clicks
- Email opt-ins
- Email open + click rates
- Product sales count + revenue
- Affiliate clicks + commissions
- Refund rate (target <5%)
- Top 3 videos, top 3 emails, top 3 affiliate offers

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TikTok ban/throttle in US | Medium | High | Diversified across YT Shorts + Reels from day 1 |
| 38 CFR §14.626 enforcement against us | Low (if disclaimers tight) | Existential | Quarterly compliance audit, lawyer consult before any "we help you" language |
| Product gets refunded heavily | Medium | High | Quality bar: every claim verifiable, money-back guarantee, public sample chapter |
| TikTok shadow-ban (faceless content sometimes flagged) | Medium | Medium | Add hand/gesture B-roll, vary voice, post manually for first 30 if needed |
| Algorithm change kills reach | High over 12 months | Medium | Newsletter list = owned audience, not platform-dependent |
| AI-generated content detected and downranked | Medium | Medium | Human review on every video, add visual variety, hire 1 voice actor for hero videos at month 4 |
| Competitor copies product | High | Low | First-mover + community trust + iteration speed wins |
| Stripe/Gumroad freezes account | Low | High | Backup processor (Lemon Squeezy), separate business bank account |
| Founder burnout | Medium | High | The 1–2 hr/day cap is the cap. Don't blow past it. |
| Self-serve affiliate programs reject anonymous brand | Medium | Medium | Apply with brand entity (LLC), use professional brand email, have site live before applying |

---

## 13. Budget

### One-time (Weeks 1–4)
| Item | Cost |
|---|---|
| Domain | $12 |
| LLC formation (recommended, via LegalZoom or Stripe Atlas) | $0–$300 |
| Brand logo (Canva or AI) | $0 |
| Lead magnet design (Canva) | $0 |
| **Total** | **$12–$312** |

### Monthly (Months 1–3)
| Item | Cost |
|---|---|
| Hosting (Vercel free tier) | $0 |
| Email (Resend free tier) | $0 |
| ElevenLabs | $5 |
| CapCut Pro (optional) | $0–$16 |
| Analytics | $0 |
| **Total** | **$5–$21/mo** |

### Monthly (Months 4–8, scaling)
| Item | Cost |
|---|---|
| Resend (over 3K/mo) | $20 |
| ElevenLabs (more usage) | $22 |
| Submagic (captions) | $16 |
| Beehiiv (if newsletter scales past 2.5K) | $39 |
| Domain renewal (yearly) | $1/mo amortized |
| **Total** | **~$100/mo** |

### Paid ad test ($500 total)
- Weeks 7–10: $20/day on best-performing video as Spark Ad / boosted Reel
- $500 / $20 = 25 days of test
- Goal: identify ROAS-positive creative, then pause until product is converting at 3%+

**Total cash needed for the full 6 months: ~$1,000.**

---

## 14. What Happens If We Plateau

| Plateau point | Plan B |
|---|---|
| Stuck at <$500/mo by month 4 | Product positioning is off. Survey email list, rewrite sales page, test new angles. |
| Stuck at <$5K/mo by month 6 | Add a second product (upsell: $297 "Claim Evidence Bible"). Average order value lifts 50%. |
| Stuck at <$15K/mo by month 8 | Flex outreach constraint. AI drafts 30 firm emails/week, you hit send. Unlocks $50–$500/lead programs. This is the single biggest lever we deliberately left off the table. |
| Algorithm collapse | Email list is owned. Pivot to long-form YouTube + newsletter sponsorships (Beehiiv ad network is self-serve, no calls). |

---

## 15. First Week Action Items

This is what happens in Week 1, in order:

1. **Choose 5 brand name candidates.** Check `.com` availability on Namecheap. Buy the winner.
   - Candidates to start from: `RatingDecoded.com`, `VetClaimAcademy.com`, `ClaimCompass.com`, `VARatingSchool.com`, `ThePresumptiveVet.com`
2. **File for LLC** (optional but recommended for affiliate applications and liability separation). Stripe Atlas or LegalZoom. ~1 hour.
3. **Set up business email** at the new domain (Google Workspace ~$6/mo or free with Zoho).
4. **Create Gumroad seller account.**
5. **Approve final product outline** (Section 3 above). Tweak modules if needed.
6. **Approve final compliance disclaimer language** (Section 4 above).
7. **Approve brand voice guidelines** (drafted by AI based on your tone preferences).
8. **Schedule Week 2 product writing sprint** — 5 days × 2 hours = 10 hrs of fact-check work.

When the founder green-lights this plan, the first code-level work is:
- Strip the existing handyman/club/dj framing from this repo
- Set up the new brand landing page + Supabase schema for leads and orders
- Deploy a v0 to Vercel under the new domain

---

## Open Decisions (Need Founder Input Before Build Starts)

1. **Brand name** — pick from the 5 above or propose alternatives
2. **LLC: yes or no** (recommend yes)
3. **Product price: $147 confirmed, or shift to $97 / $197 / $247?**
4. **Email service: Resend or Beehiiv?** (Resend = transactional + nurture, Beehiiv = newsletter-native with built-in sponsorship marketplace)
5. **Checkout: Gumroad or Stan Store?** (Stan Store has better link-in-bio integration; Gumroad has lower fees on higher-volume tiers)
6. **Posting cadence: 3/day per platform or start at 1/day and scale?**

---

## Appendix A: Why $1K/Day Was Hard With Original Constraints

For reference, here's the math that forced us to flex the "build a product" constraint:

- Self-serve affiliate EPC in veteran/finance niche: $0.50–$2.00
- $1K/day ÷ $1 EPC = 1,000 outbound affiliate clicks/day
- 1,000 clicks ÷ 5% CTR on affiliate links = 20,000 daily site visits
- 20,000 daily visits = ~600K monthly visits = top 5,000-ranking sites in any niche
- Realistic timeline from zero with no outreach: 18–30 months

By adding a $147 own-product, the math becomes:
- $1K/day ÷ $147 = 7 sales/day
- 7 sales/day ÷ 3% email-to-buyer conversion = 233 daily email opens
- 233 opens ÷ 30% open rate = 777 active email subs
- 777 active subs is reachable with 5K total list size
- 5K list size from short-form video is a 4–6 month grind, not 18–30

This is why the product is the unlock.

---

*End of plan. Awaiting founder go/no-go on Open Decisions above before any code is written.*
