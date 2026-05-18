import Link from "next/link";

export const metadata = { title: "Help · TaxAutopilot" };

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-[var(--navy-900)] flex items-center justify-center shadow-md">
              <div className="absolute inset-1.5 rounded-md bg-gradient-to-br from-[var(--green-500)] to-[var(--gold)]" />
              <span className="relative text-white font-extrabold text-sm">T</span>
            </div>
            <span className="font-bold text-[var(--navy-900)] tracking-tight">TaxAutopilot</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-[var(--green-600)] hover:underline">
            Dashboard →
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-extrabold text-[var(--navy-900)] mb-1">Help &amp; Setup Guide</h1>
        <p className="text-[var(--text-muted)] mb-8">
          Quick answers to the most common questions.{" "}
          <strong className="text-[var(--navy-900)]">Tip:</strong> the 💬 button bottom-right
          of any logged-in page answers questions in real time about YOUR specific state.
        </p>

        <Section title="💰 Pricing &amp; Costs">
          <Faq q="What does TaxAutopilot REALLY cost? Are there hidden fees?">
            No hidden fees. Your subscription covers all software, AI, hosting, support. The
            ONLY extra cost is <strong>Twilio for SMS</strong> if you want to text clients —
            about <strong>$15-30/month</strong> for most offices, paid directly to Twilio.
            Full breakdown at{" "}
            <Link href="/pricing-breakdown" className="text-[var(--green-600)] underline font-semibold">
              /pricing-breakdown
            </Link>{" "}
            (downloadable as PDF).
          </Faq>

          <Faq q="What if I don't want to use Twilio for SMS?">
            Totally optional. Document extraction, inbox AI, email replies, refund tracking,
            campaigns, and team features all work without Twilio. You just won&apos;t have the
            SMS-to-client capability.
          </Faq>

          <Faq q="Do I need to keep paying for Drake/CrossLink/Lacerte separately?">
            Yes. TaxAutopilot sits ALONGSIDE your tax software, not instead of it. You keep
            using your tax software for actual return preparation and e-filing — we handle
            the surrounding office work (docs, comms, refund alerts, win-backs).
          </Faq>
        </Section>

        <Section title="🚀 Getting Started">
          <Faq q="How do I import my existing clients?">
            Go to <Code>Clients → Import CSV</Code>. Export from your tax software, drop the file,
            hit Import. The only required column is <Code>full_name</Code>. Other recognized:
            email, phone, ssn_last4, last_filed_year, notes.
          </Faq>

          <Faq q="How do I connect my email inbox?">
            <Code>Settings → Connect a new inbox</Code>. Pick the scope first (Office-wide vs Just for me),
            then click Gmail, Outlook, or Other (IMAP). Sign in. Done.
          </Faq>

          <Faq q="How do I set up SMS?">
            Sign up at twilio.com (~$1/month per number). Buy a phone number. Go to{" "}
            <Code>Settings → Twilio</Code>, paste your Account SID + Auth Token + phone number.
            Copy the webhook URL we display and paste it into your Twilio Console for your number.
          </Faq>

          <Faq q="How do I activate my subscription?">
            <Code>Settings → Billing</Code>. Pick a tier (Solo / Growth / Office). Click Subscribe.
            Stripe handles the rest. Your Founders rate is locked for life.
          </Faq>
        </Section>

        <Section title="👥 Team &amp; Permissions">
          <Faq q="How do I invite preparers?">
            <Code>Team → Invite a teammate</Code>. Enter email + role (owner / admin / preparer).
            They get an email with an accept link.
          </Faq>

          <Faq q="What's the difference between roles?">
            <strong>Owner:</strong> full access including billing. <strong>Admin:</strong> manages team and settings, no billing.{" "}
            <strong>Preparer:</strong> handles assigned clients, sees their own work by default.
          </Faq>

          <Faq q="Can each preparer have their own SMS line?">
            Yes. In <Code>Settings → Twilio</Code>, when connecting a number choose &ldquo;Just for me&rdquo;.
            Incoming texts on that number route only to that preparer. Replies go from the same line.
          </Faq>

          <Faq q="Can each preparer have their own email inbox?">
            Yes. Same pattern — in <Code>Settings → Connect a new inbox</Code>, pick &ldquo;Just for me&rdquo;
            for personal inboxes that only you see, or &ldquo;Office-wide&rdquo; for shared team inboxes.
          </Faq>
        </Section>

        <Section title="💰 Refund Tracking &amp; Campaigns">
          <Faq q="How do I start tracking a refund?">
            Open the client → <Code>Refund Tracking</Code> → Start Tracking. Enter tax year,
            filing date, refund amount, method. We auto-schedule SMS alerts on days 0, 3, 14, 21, 28.
          </Faq>

          <Faq q="How do I send a win-back campaign to lapsed clients?">
            <Code>Campaigns → New Campaign</Code>. Pick channel (SMS / email / both). Set
            &ldquo;haven&apos;t filed in X+ years&rdquo;. Click Preview Audience to see who&apos;ll get messaged.
            Launch — AI writes a personalized message for every recipient.
          </Faq>
        </Section>

        <Section title="🎁 Referrals &amp; Billing">
          <Faq q="How do referrals work?">
            Every office has a unique code (find it in <Code>Referrals</Code>). Share your link.
            New signups via your link = $250 credit toward your next renewal, plus $250 off their
            first year. Stack 10 = your renewal is free.
          </Faq>

          <Faq q="When do referral credits apply?">
            Automatically on your next renewal invoice. We apply them as a Stripe customer
            balance reduction. You&apos;ll see the discount on your invoice.
          </Faq>

          <Faq q="How do I cancel or change my plan?">
            <Code>Settings → Billing → Manage subscription</Code>. Opens Stripe&apos;s portal where
            you can change plans, update cards, view invoices, or cancel.
          </Faq>
        </Section>

        <Section title="🔐 Privacy &amp; Account">
          <Faq q="How do I change my password?">
            <Code>Settings → Account → Change Password</Code>. Or from login screen click
            &ldquo;Forgot password&rdquo; — we&apos;ll email you a reset link.
          </Faq>

          <Faq q="Can I delete my account and all data?">
            Yes. <Code>Settings → Account → Delete Account</Code>. Permanent and immediate.
            Your client data, documents, messages, and billing history are all removed.
          </Faq>

          <Faq q="Can I export my data?">
            Yes. <Code>Settings → Account → Export Data</Code>. We give you a JSON file with
            everything — clients, documents extracted, conversations, refund tracking.
          </Faq>
        </Section>

        <Section title="🆘 Stuck?">
          <Faq q="The AI helper isn't answering">
            Try a more specific question, or refresh the page. If still broken, email{" "}
            <a href="mailto:support@taxautopilot.ai" className="text-[var(--green-600)] underline">
              support@taxautopilot.ai
            </a>.
          </Faq>

          <Faq q="Twilio isn't receiving texts">
            Double-check the webhook URL in your Twilio Console matches{" "}
            <Code>{`{your-url}/api/twilio/sms-incoming`}</Code> and is set to HTTP POST. Test by
            texting your Twilio number — the message should appear in <Code>/messages</Code>
            within 30 seconds.
          </Faq>

          <Faq q="Gmail / Outlook says the connection is expired">
            Sometimes Google or Microsoft revokes tokens after long inactivity. Go to{" "}
            <Code>Settings</Code>, click Disconnect on the expired connection, then reconnect
            it. Same account, same data.
          </Faq>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-extrabold text-[var(--navy-900)] mb-4">{title}</h2>
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="cursor-pointer p-5 list-none flex items-center justify-between gap-3">
        <span className="font-bold text-[var(--navy-900)]">{q}</span>
        <span className="text-[var(--green-600)] font-bold transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="px-5 pb-5 text-sm text-[var(--text)] leading-relaxed">{children}</div>
    </details>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-xs bg-slate-100 text-[var(--navy-900)] px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}
