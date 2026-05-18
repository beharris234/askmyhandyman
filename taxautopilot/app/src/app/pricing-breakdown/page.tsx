import Link from "next/link";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Pricing Breakdown · TaxAutopilot" };

export default function PricingBreakdownPage() {
  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-[var(--navy-900)] flex items-center justify-center shadow-md">
              <div className="absolute inset-1.5 rounded-md bg-gradient-to-br from-[var(--green-500)] to-[var(--gold)]" />
              <span className="relative text-white font-extrabold text-sm">T</span>
            </div>
            <span className="font-bold text-[var(--navy-900)] tracking-tight">TaxAutopilot</span>
          </Link>
          <PrintButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 print:py-4">
        {/* Print-only header */}
        <div className="hidden print:block mb-6 pb-4 border-b border-slate-300">
          <div className="font-bold text-xl text-[var(--navy-900)]">TaxAutopilot</div>
          <div className="text-xs text-[var(--text-muted)]">The AI Office Manager for Tax Pros</div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--navy-900)] mb-1">
          Total Cost of Ownership
        </h1>
        <p className="text-[var(--text-muted)] mb-8">
          Full breakdown of what TaxAutopilot costs — and what you might pay separately.
          No surprises.
        </p>

        {/* TL;DR */}
        <div className="bg-gradient-to-br from-[var(--green-100)] to-amber-50 border border-[var(--green-500)]/30 rounded-2xl p-6 mb-8 print:bg-slate-50 print:border-slate-300">
          <div className="text-xs uppercase font-bold tracking-wider text-[var(--green-600)] mb-2">
            TL;DR
          </div>
          <p className="text-[var(--navy-900)] font-semibold text-lg leading-relaxed">
            Your TaxAutopilot subscription <span className="bg-white px-1.5 py-0.5 rounded">+ ~$15-40/mo in Twilio fees if you use SMS</span>. That&apos;s usually it.
          </p>
        </div>

        {/* Subscription */}
        <Section title="💼 Your TaxAutopilot Subscription" subtitle="What you pay us directly. Founders rate locks for life.">
          <Table
            rows={[
              ["Solo Founders", "1 preparer · 500 clients · 1 SMS line", "$2,497 / year"],
              ["Growth Founders ⭐", "5 preparers · 1,500 clients · 5 SMS lines", "$4,997 / year"],
              ["Office Founders", "20 preparers · unlimited clients · 20 SMS lines", "$9,997 / year"],
              ["Enterprise", "50+ preparers · multi-location · custom", "Custom"],
            ]}
          />
          <Note>
            🛡 60-day money-back guarantee if we don&apos;t find at least $3,000–$5,000 of revenue opportunities in your database.
          </Note>
        </Section>

        {/* Included */}
        <Section title="✅ What's included (we pay for it)" subtitle="No extra cost to you — bundled into your subscription.">
          <BulletList
            items={[
              "AI processing for document extraction, email classification, reply drafting (Claude API)",
              "All hosting, database, and infrastructure (Supabase + Vercel)",
              "Transactional emails — welcome, invites, milestone notifications (Resend)",
              "All software updates and new features",
              "Customer support + the in-app AI helper (24/7)",
              "Security infrastructure (encryption, multi-tenant isolation, SOC 2-aligned)",
              "Webhook delivery and processing",
              "Daily refund-alert cron job",
            ]}
          />
        </Section>

        {/* Twilio */}
        <Section title="📱 Twilio (SMS — strongly recommended)" subtitle="You sign up directly at twilio.com and pay Twilio directly. Industry standard — same as Podium, Birdeye, etc.">

          {/* WHY TWILIO IS WORTH IT — the reframe */}
          <div className="rounded-xl bg-gradient-to-br from-[var(--navy-900)] to-[var(--navy-700)] text-white p-5 mb-5 print:bg-slate-100 print:text-[var(--navy-900)] print:border print:border-slate-300">
            <div className="text-xs uppercase font-bold tracking-wider text-[var(--gold)] mb-2 print:text-amber-700">
              ✋ Real talk — why $30/mo is the best $30 you&apos;ll spend
            </div>
            <div className="font-bold text-base mb-3">
              Right now, your clients probably text your PERSONAL cell phone.
              That&apos;s a problem you don&apos;t realize you have.
            </div>
            <ul className="space-y-1.5 text-sm text-white/90 print:text-[var(--text)]">
              <li>📵 Clients text you at 11pm. On Sundays. During your vacation.</li>
              <li>👨‍👩‍👧 Your spouse sees client business on your screen. So does your kid.</li>
              <li>🤝 Your personal number is now in 800 random people&apos;s contacts. Forever.</li>
              <li>🚫 No record of conversations — &ldquo;I told you X&rdquo; arguments you can&apos;t prove.</li>
              <li>🤷 Preparer is out sick — nobody else can answer their clients.</li>
              <li>⚠️ IRS Circular 230 compliance — personal texts about tax matters are messy.</li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/20 print:border-slate-300">
              <div className="font-bold text-base mb-1.5">With a Twilio number ($30/mo for a busy office):</div>
              <ul className="space-y-1 text-sm text-white/90 print:text-[var(--text)]">
                <li>✅ Office number on business cards. Personal cell stays personal.</li>
                <li>✅ AI auto-replies to &ldquo;where&apos;s my refund?&rdquo; at 2am — you sleep.</li>
                <li>✅ Every preparer can have their own line — clean handoffs.</li>
                <li>✅ All conversations logged + searchable — IRS-ready records.</li>
                <li>✅ Vacation? AI keeps responding. Clients don&apos;t know.</li>
              </ul>
            </div>
            <div className="mt-3 text-xs italic text-white/70 print:text-[var(--text-muted)]">
              Most tax pros realize they should have done this 5 years ago. $30/mo is laughably cheap compared to one weekend of messy personal-cell texts.
            </div>
          </div>

          <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-2">
            What it actually costs
          </div>
          <Table
            rows={[
              ["Phone number", "Per US local number per month", "$1.15 / mo"],
              ["Outbound SMS (you texting client)", "Per segment", "$0.0079"],
              ["Inbound SMS (client texting you)", "Per segment", "$0.0079"],
              ["Effective cost per back-and-forth", "1 outbound + 1 inbound", "~1.6¢"],
            ]}
          />

          <SubHeading>Realistic monthly cost examples</SubHeading>
          <Table
            rows={[
              ["Small office", "1 number + 300 messages/mo", "~$3.50 / mo"],
              ["Medium office", "1 number + 1,500 messages/mo", "~$13 / mo"],
              ["Large office", "1 number + 5,000 messages/mo", "~$41 / mo"],
              ["Growth tier office", "5 numbers + 1,500 messages/mo", "~$19 / mo"],
              ["Office tier (max)", "20 numbers + 8,000 messages/mo", "~$87 / mo"],
            ]}
          />
          <Note>
            💡 You only pay for what you use. SMS is opt-in — skip Twilio entirely if you only want the AI extractor + inbox + refund tracking (no texting).
          </Note>
        </Section>

        {/* What's separate */}
        <Section title="🔌 Your existing software (we don't replace it)" subtitle="Whatever you already pay these companies — that stays the same.">
          <BulletList
            items={[
              "Tax software (Drake, CrossLink, Lacerte, ProSeries, UltraTax, TaxWise, TaxSlayer) — keep paying them directly. TaxAutopilot sits ALONGSIDE your tax software, not instead of it.",
              "Email service (Gmail free / Workspace ~$6-18/mo / Outlook included in M365). We connect to what you already have.",
              "Computer + internet — you already have these.",
            ]}
          />
        </Section>

        {/* Real examples */}
        <Section title="💰 Real-world total monthly cost examples" subtitle="What a busy office actually spends per month.">
          <ExampleCard
            title="Solo office during tax season"
            lines={[
              ["TaxAutopilot Solo (annual $2,497)", "$208 / mo"],
              ["Twilio (1,500 messages/mo)", "$13 / mo"],
              ["Total extra cost", "$221 / mo"],
            ]}
            note="Tax season is 4 months. So actual added cost for the year ≈ ($208 × 12) + ($13 × 4) = $2,549."
          />
          <ExampleCard
            title="Growth-tier office (5 preparers, year-round)"
            lines={[
              ["TaxAutopilot Growth (annual $4,997)", "$416 / mo"],
              ["Twilio (5 numbers + ~2,000 messages)", "$22 / mo"],
              ["Total", "$438 / mo"],
            ]}
            note="One found amendment for a missed Earned Income Credit pays this off in the first week."
          />
          <ExampleCard
            title="Office-tier (20 preparers, 50+ msg/day)"
            lines={[
              ["TaxAutopilot Office (annual $9,997)", "$833 / mo"],
              ["Twilio (20 numbers + ~6,000 messages)", "$70 / mo"],
              ["Total", "$903 / mo"],
            ]}
            note="That's ~$45/preparer/month for the entire AI office stack."
          />
        </Section>

        {/* What we DON'T charge for */}
        <Section title="🚫 What we will NEVER charge extra for" subtitle="If we add it, it's included. No nickel-and-diming.">
          <BulletList
            items={[
              "Per-document fees for AI extraction",
              "Per-client fees within your tier limits",
              "Per-email or per-API-call surcharges",
              "Charges for AI helper conversations",
              "Premium features paywall (everything is in your tier)",
              "Support fees — chat with the AI helper or email us free",
              "Setup fees on annual plans",
            ]}
          />
        </Section>

        {/* Cancel anytime */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-[var(--navy-900)] mb-2">🛡 Risk-free</h3>
          <p className="text-sm text-[var(--text)] leading-relaxed">
            <strong>60-day money-back guarantee</strong> on annual plans. If we don&apos;t find at least
            $3,000 (Solo) or $5,000 (Growth/Office) of revenue opportunities in your database in
            the first 60 days, we refund 100% of your TaxAutopilot subscription. (Note: Twilio
            charges are paid directly to Twilio — we can&apos;t refund those.)
          </p>
        </div>

        <div className="text-xs text-center text-[var(--text-muted)] mt-12 print:mt-6">
          Pricing accurate as of January 2026. Twilio pricing is theirs — confirm current rates at twilio.com/pricing.
          <br />
          <Link href="/" className="text-[var(--green-600)] underline print:no-underline">taxautopilot.ai</Link>
          {" · "}
          <a href="mailto:support@taxautopilot.ai" className="text-[var(--green-600)] underline print:no-underline">support@taxautopilot.ai</a>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 print:mb-5">
      <h2 className="text-xl font-extrabold text-[var(--navy-900)] mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-[var(--text-muted)] mb-4">{subtitle}</p>}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 print:bg-white print:border-slate-300">
        {children}
      </div>
    </div>
  );
}

function Table({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="divide-y divide-slate-100">
      {rows.map(([a, b, c], i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1.5fr_auto] gap-2 py-2.5 text-sm">
          <div className="font-semibold text-[var(--navy-900)]">{a}</div>
          <div className="text-[var(--text-muted)]">{b}</div>
          <div className="font-mono font-bold text-[var(--navy-900)] sm:text-right">{c}</div>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]">
          <span className="text-[var(--green-500)] mt-0.5 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mt-4 mb-2">
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-[var(--text)] print:bg-white">
      {children}
    </div>
  );
}

function ExampleCard({
  title,
  lines,
  note,
}: {
  title: string;
  lines: [string, string][];
  note: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="font-bold text-[var(--navy-900)] mb-2">{title}</div>
      <div className="bg-slate-50 rounded-lg p-3 print:bg-white print:border print:border-slate-200">
        <div className="divide-y divide-slate-200">
          {lines.map(([label, value], i) => (
            <div
              key={i}
              className={`flex justify-between text-sm py-1.5 ${
                i === lines.length - 1 ? "font-bold text-[var(--navy-900)] pt-2" : "text-[var(--text)]"
              }`}
            >
              <span>{label}</span>
              <span className="font-mono">{value}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] italic mt-2 pt-2 border-t border-slate-200">
          {note}
        </div>
      </div>
    </div>
  );
}
