import Link from "next/link";
import { IMAP_PRESETS } from "@/lib/imap";
import { ImapConnectForm } from "./ImapConnectForm";

export default function ImapConnectPage() {
  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to settings
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-1">
          Connect any email via IMAP
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          For Yahoo, iCloud, AOL, GoDaddy, cPanel, and any other email host.
          Your password is encrypted with AES-256 before being stored.
        </p>

        <ImapConnectForm presets={IMAP_PRESETS} />

        <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-[var(--text-muted)] space-y-1.5">
          <div>
            🔐 <strong>Security:</strong> Passwords are encrypted at rest with AES-256-GCM
            and only decrypted in memory at sync time.
          </div>
          <div>
            🔑 <strong>App passwords:</strong> Most providers (Gmail, Yahoo, iCloud, AOL,
            Microsoft 365) require an app-specific password if you use 2FA. Use that
            instead of your normal password.
          </div>
        </div>
      </div>
    </div>
  );
}
