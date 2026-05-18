import Link from "next/link";

export const metadata = { title: "Terms of Service · TaxAutopilot" };

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated="January 2026">
      <h2>1. Agreement</h2>
      <p>
        By creating a TaxAutopilot account or using our service you agree to these
        terms. If you don&apos;t agree, please don&apos;t use the service.
      </p>

      <h2>2. Service description</h2>
      <p>
        TaxAutopilot provides AI-powered office automation software for tax
        preparation businesses, including document extraction, client
        communication automation (SMS and email), refund tracking, win-back
        campaigns, and team management features.
      </p>

      <h2>3. Subscription &amp; billing</h2>
      <ul>
        <li>Plans are billed annually in advance unless otherwise specified.</li>
        <li>Pricing tiers and feature limits are listed at <a href="/#pricing">taxautopilot.ai/#pricing</a>.</li>
        <li>
          &ldquo;Founders Pricing&rdquo; means your rate is locked at the price you signed up at,
          for the lifetime of your continuous subscription. If you cancel and resubscribe,
          you forfeit the locked rate.
        </li>
        <li>Subscriptions auto-renew unless canceled via Settings → Billing.</li>
        <li>
          Referral credits earned through our referral program are automatically applied
          to your next renewal as a balance reduction. Credits expire when your subscription
          ends.
        </li>
      </ul>

      <h2>4. 60-day money-back guarantee</h2>
      <p>
        If we don&apos;t find at least $3,000 of revenue opportunities in your database in
        your first 60 days of paid subscription (Solo) — or $5,000 (Growth) — you can
        request a full refund. After 60 days, no refunds, but you can cancel at any time
        and won&apos;t be billed for the next term.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Use TaxAutopilot for any illegal activity</li>
        <li>Send spam, phishing, or unsolicited bulk messages through our SMS or email tools</li>
        <li>Upload malware or attempt to compromise our systems</li>
        <li>Resell, white-label, or sublicense the service without written permission</li>
        <li>Scrape or reverse-engineer the platform</li>
        <li>Use it for tax preparation outside of US federal and state returns without our prior approval</li>
      </ul>
      <p>
        We reserve the right to suspend accounts that violate these terms, including
        prorated refund of unused time.
      </p>

      <h2>6. Your client data</h2>
      <p>
        You retain ownership of all data you upload (client records, tax documents,
        communications). We process it solely to provide you the service. See our{" "}
        <Link href="/privacy">Privacy Policy</Link> for full details.
      </p>
      <p>
        You are solely responsible for ensuring you have the legal right to upload your
        clients&apos; data and for complying with applicable tax preparer regulations
        (IRS Circular 230, state CPA boards, etc.).
      </p>

      <h2>7. AI-generated content</h2>
      <p>
        TaxAutopilot uses AI to extract document fields, classify emails, and draft
        client communications. You are responsible for reviewing AI-generated content
        before sending or relying on it. AI extraction is provided &ldquo;as is&rdquo; — verify
        accuracy before filing returns based on extracted data.
      </p>

      <h2>8. Third-party services</h2>
      <p>
        Optional integrations (Gmail, Outlook, Twilio, etc.) are governed by those
        providers&apos; own terms. We are not responsible for their downtime or data
        handling.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        TaxAutopilot is NOT a tax advisor, accountant, or law firm. We provide
        productivity software. We do not give tax advice. We are not responsible for
        tax outcomes, IRS audits, penalties, or refund timing.
      </p>
      <p>
        Service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; We disclaim all warranties
        to the maximum extent permitted by law.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        Our total liability to you for any claim is limited to the amount you paid us
        in the 12 months preceding the claim. We are not liable for indirect,
        incidental, or consequential damages.
      </p>

      <h2>11. Termination</h2>
      <p>
        You can cancel anytime in Settings → Billing. We can suspend or terminate
        accounts that violate these terms, fail to pay, or pose a security risk.
        On termination, your data is retained for 90 days for recovery, then permanently
        deleted (unless you request immediate deletion).
      </p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Delaware, USA. Disputes
        will be resolved in Delaware state or federal court.
      </p>

      <h2>13. Changes</h2>
      <p>
        We&apos;ll notify you via email of material changes at least 30 days before they
        take effect. Continued use after the effective date means you accept the new terms.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these terms? Email <a href="mailto:legal@taxautopilot.ai">legal@taxautopilot.ai</a>.
      </p>
    </LegalShell>
  );
}

function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-[var(--navy-900)] flex items-center justify-center shadow-md">
              <div className="absolute inset-1.5 rounded-md bg-gradient-to-br from-[var(--green-500)] to-[var(--gold)]" />
              <span className="relative text-white font-extrabold text-sm">T</span>
            </div>
            <span className="font-bold text-[var(--navy-900)] tracking-tight">TaxAutopilot</span>
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
          {title}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: {lastUpdated}</p>
        <div className="prose prose-slate max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--navy-900)] [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-[var(--text)] [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_li]:my-1 [&_a]:text-[var(--green-600)] [&_a]:underline">
          {children}
        </div>
        <div className="mt-12 pt-6 border-t border-slate-200">
          <Link href="/" className="text-sm text-[var(--green-600)] font-semibold">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
