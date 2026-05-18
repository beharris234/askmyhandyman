import Link from "next/link";

export const metadata = { title: "Privacy Policy · TaxAutopilot" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated="January 2026">
      <h2>1. Overview</h2>
      <p>
        TaxAutopilot (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides AI-powered office automation
        software for tax preparation businesses. This Privacy Policy explains
        what data we collect, how we use it, who we share it with, and your
        rights over it.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Account data</h3>
      <ul>
        <li>Your name, email address, password (hashed)</li>
        <li>Your tax office name and the tax software you use</li>
        <li>Billing information processed by Stripe (we never see card numbers)</li>
      </ul>

      <h3>Data you upload</h3>
      <ul>
        <li>Client records (name, email, phone, last 4 of SSN, notes)</li>
        <li>Tax documents (W-2s, 1099s, etc.) you or your clients upload</li>
        <li>Extracted data from those documents</li>
        <li>SMS and email communications routed through TaxAutopilot</li>
      </ul>

      <h3>Connected services</h3>
      <ul>
        <li>If you connect Gmail or Outlook: OAuth tokens, email metadata, attachments</li>
        <li>If you connect an IMAP account: encrypted password, email metadata</li>
        <li>If you connect Twilio: encrypted Auth Token, SMS message contents</li>
      </ul>

      <h3>Usage data</h3>
      <ul>
        <li>Pages visited, features used, error logs</li>
        <li>IP address and user agent for security purposes</li>
      </ul>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To provide the service you signed up for</li>
        <li>To process documents and draft communications via AI</li>
        <li>To send transactional emails (welcome, invites, milestones, billing)</li>
        <li>To prevent fraud and abuse</li>
        <li>To improve the product (aggregated, never personally identifying)</li>
      </ul>
      <p>
        <strong>
          We do NOT sell your data or your clients&apos; data to third parties.
          We do NOT train AI models on your data.
        </strong>
      </p>

      <h2>4. Who we share data with</h2>
      <ul>
        <li>
          <strong>Anthropic</strong> — AI processing for document extraction, message
          drafting, and the in-app helper. Anthropic processes data on our behalf
          and does not train on it.
        </li>
        <li>
          <strong>Supabase</strong> — Database and authentication hosting.
        </li>
        <li>
          <strong>Stripe</strong> — Payment processing.
        </li>
        <li>
          <strong>Twilio</strong> (if connected) — SMS delivery.
        </li>
        <li>
          <strong>Resend</strong> — Transactional email delivery.
        </li>
        <li>
          <strong>Google</strong> or <strong>Microsoft</strong> (if connected) — Email reading and sending.
        </li>
        <li>
          <strong>Vercel</strong> — Hosting and CDN.
        </li>
      </ul>
      <p>All vendors are bound by data-processing agreements.</p>

      <h2>5. Data retention</h2>
      <p>
        We retain your data for as long as your account is active, plus 90 days
        after cancellation for accounting and recovery purposes. You can request
        immediate deletion at any time via Settings → Account → Delete Account.
      </p>

      <h2>6. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of all data we hold about you</li>
        <li><strong>Delete</strong> — request permanent deletion of your account and data</li>
        <li><strong>Correct</strong> — fix any inaccurate information</li>
        <li><strong>Export</strong> — download your data in machine-readable format</li>
        <li><strong>Object</strong> — opt out of non-essential processing</li>
      </ul>
      <p>Use Settings → Account to exercise these rights, or email us.</p>

      <h2>7. Security</h2>
      <p>
        We encrypt sensitive credentials (IMAP passwords, Twilio Auth Tokens)
        at rest with AES-256-GCM. All data in transit uses TLS 1.2+. Database
        access is restricted by Row-Level Security so one tax office can never
        see another&apos;s data, even by accident.
      </p>

      <h2>8. Children</h2>
      <p>TaxAutopilot is not directed to children under 13. We do not knowingly collect data from them.</p>

      <h2>9. Changes to this policy</h2>
      <p>
        We&apos;ll notify you via email of material changes to this policy at least
        30 days before they take effect.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions? Email us at <a href="mailto:privacy@taxautopilot.ai">privacy@taxautopilot.ai</a>.
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
        <div className="prose prose-slate max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--navy-900)] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[var(--navy-900)] [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:text-[var(--text)] [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_li]:my-1 [&_a]:text-[var(--green-600)] [&_a]:underline">
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
