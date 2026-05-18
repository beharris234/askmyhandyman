import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CLASSIFICATION_META: Record<
  string,
  { emoji: string; label: string; tone: "green" | "amber" | "red" | "slate" | "navy" }
> = {
  document_submission: { emoji: "📎", label: "Doc Submission", tone: "green" },
  question: { emoji: "❓", label: "Question", tone: "navy" },
  irs_notice: { emoji: "⚠️", label: "IRS Notice", tone: "red" },
  scheduling: { emoji: "📅", label: "Scheduling", tone: "amber" },
  spam: { emoji: "🚫", label: "Spam", tone: "slate" },
  other: { emoji: "📨", label: "Other", tone: "slate" },
};

export default async function InboxPage() {
  const supabase = await createClient();

  const { data: emails } = await supabase
    .from("processed_emails")
    .select("*, clients(id, full_name)")
    .order("received_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight">Inbox</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            What your AI has processed. Sorted newest first.
          </p>
        </div>
        <Link
          href="/settings"
          className="text-xs font-bold text-[var(--green-600)] hover:underline"
        >
          Manage inboxes →
        </Link>
      </div>

      {emails && emails.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {emails.map((e) => {
            const meta =
              CLASSIFICATION_META[e.ai_classification || "other"] || CLASSIFICATION_META.other;
            const client = e.clients as { id: string; full_name: string } | null;
            return (
              <div key={e.id} className="p-4 sm:p-5 hover:bg-slate-50 transition">
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0">{meta.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <ClassificationPill meta={meta} />
                      {client ? (
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-xs font-bold text-[var(--green-600)] hover:underline"
                        >
                          {client.full_name}
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-[var(--text-light)]">
                          Unmatched sender
                        </span>
                      )}
                      {e.documents_created > 0 && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--gold-light)] text-amber-900">
                          {e.documents_created} doc{e.documents_created > 1 ? "s" : ""} extracted
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-[var(--navy-900)] truncate">
                      {e.subject || "(no subject)"}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] truncate">
                      From <span className="font-medium text-[var(--navy-900)]">{e.sender_name || e.sender_email}</span>
                      {" · "}
                      {timeAgo(e.received_at)}
                    </div>
                    {e.ai_summary && (
                      <div className="mt-2 text-sm text-[var(--text)] italic">
                        &ldquo;{e.ai_summary}&rdquo;
                      </div>
                    )}
                    {e.ai_suggested_action && (
                      <div className="mt-1.5 text-xs text-[var(--text-muted)]">
                        <strong className="text-[var(--navy-900)]">Suggested action:</strong>{" "}
                        {e.ai_suggested_action}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-3 opacity-40">📭</div>
          <h3 className="font-bold text-[var(--navy-900)] mb-1">No emails processed yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-5 max-w-md mx-auto">
            Connect your Gmail in Settings, then hit Sync. The AI will read recent
            emails, file attached docs to clients, and surface what needs your attention.
          </p>
          <Link
            href="/settings"
            className="inline-block bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
          >
            Connect Inbox →
          </Link>
        </div>
      )}
    </div>
  );
}

function ClassificationPill({
  meta,
}: {
  meta: { label: string; tone: "green" | "amber" | "red" | "slate" | "navy" };
}) {
  const toneCls = {
    green: "bg-[var(--green-100)] text-[var(--green-600)]",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-600",
    navy: "bg-[var(--navy-100)] text-[var(--navy-700)]",
  }[meta.tone];
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${toneCls}`}>
      {meta.label}
    </span>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "unknown time";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
