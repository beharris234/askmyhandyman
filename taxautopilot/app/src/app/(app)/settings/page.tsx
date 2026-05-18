import { createClient } from "@/lib/supabase/server";
import { disconnectConnectionAction, syncNowAction } from "./actions";
import { SyncButton, DisconnectButton } from "./Buttons";

type SearchParams = Promise<{ connected?: string; error?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: connections } = await supabase
    .from("email_connections")
    .select("id, provider, email_address, status, last_synced_at, created_at")
    .order("created_at", { ascending: false });

  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID);
  const microsoftConfigured = Boolean(process.env.MICROSOFT_CLIENT_ID);
  const encryptionConfigured = Boolean(
    process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Settings
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        Connect your inbox so the AI can start handling docs and client questions for you.
      </p>

      {/* Status banners */}
      {params.connected && (
        <div className="mb-6 rounded-lg bg-[var(--green-100)] border border-[var(--green-500)]/30 px-4 py-3 text-sm text-[var(--green-600)] font-semibold">
          ✓ Connected {decodeURIComponent(params.connected)}
        </div>
      )}
      {params.error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <strong className="block mb-0.5">Connection failed</strong>
          {decodeURIComponent(params.error)}
        </div>
      )}

      {/* Connected inboxes */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-bold text-[var(--navy-900)] mb-4">Connected inboxes</h2>

        {connections && connections.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{conn.provider === "gmail" ? "📧" : "✉️"}</span>
                    <div className="font-semibold text-[var(--navy-900)] truncate">
                      {conn.email_address}
                    </div>
                    <StatusPill status={conn.status} />
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 ml-7">
                    {conn.last_synced_at
                      ? `Last synced ${timeAgo(conn.last_synced_at)}`
                      : "Never synced yet"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SyncButton id={conn.id} action={syncNowAction} />
                  <DisconnectButton id={conn.id} action={disconnectConnectionAction} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-[var(--text-muted)]">
            No inboxes connected yet. Connect one below.
          </div>
        )}
      </section>

      {/* Connect new */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-[var(--navy-900)] mb-1">Connect a new inbox</h2>
        <p className="text-sm text-[var(--text-muted)] mb-5">
          The AI reads incoming emails, files attached docs to the right client, and
          flags ones that need your attention.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ProviderCard
            emoji="📧"
            title="Gmail"
            sub="Google Workspace or personal"
            href="/api/google/connect"
            enabled={googleConfigured}
            disabledReason="Set GOOGLE_CLIENT_ID in .env"
          />
          <ProviderCard
            emoji="✉️"
            title="Outlook / Microsoft 365"
            sub="Personal or work account"
            href="/api/microsoft/connect"
            enabled={microsoftConfigured}
            disabledReason="Set MICROSOFT_CLIENT_ID in .env"
          />
          <ProviderCard
            emoji="📬"
            title="Any Other Email"
            sub="Yahoo · iCloud · GoDaddy · custom — IMAP"
            href="/settings/imap"
            enabled={encryptionConfigured}
            disabledReason="Set ENCRYPTION_KEY (32+ chars) in .env"
          />
        </div>
      </section>
    </div>
  );
}

function ProviderCard({
  emoji,
  title,
  sub,
  href,
  enabled,
  disabledReason,
}: {
  emoji: string;
  title: string;
  sub: string;
  href: string;
  enabled: boolean;
  disabledReason: string;
}) {
  if (!enabled) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-4 opacity-60">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[var(--navy-900)]">{title}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {disabledReason}
          </div>
        </div>
      </div>
    );
  }
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl border-2 border-slate-200 p-4 hover:border-[var(--green-500)] transition group"
    >
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[var(--navy-900)] group-hover:text-[var(--green-600)]">
          {title}
        </div>
        <div className="text-xs text-[var(--text-muted)]">{sub}</div>
      </div>
      <span className="text-[var(--green-600)] font-bold">→</span>
    </a>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "active"
      ? "bg-[var(--green-100)] text-[var(--green-600)]"
      : status === "error"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-600";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cls}`}>
      {status}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
