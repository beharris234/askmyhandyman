import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmailReplyBox } from "./EmailReplyBox";

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: email } = await supabase
    .from("processed_emails")
    .select("*, clients(id, full_name), email_connections(provider, email_address)")
    .eq("id", id)
    .single();

  if (!email) notFound();

  const client = Array.isArray(email.clients) ? email.clients[0] : email.clients;
  const connection = Array.isArray(email.email_connections)
    ? email.email_connections[0]
    : email.email_connections;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <Link
        href="/inbox"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to inbox
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-[var(--navy-900)] mb-1 break-words">
              {email.subject || "(no subject)"}
            </h1>
            <div className="text-sm text-[var(--text-muted)]">
              From{" "}
              <span className="font-semibold text-[var(--navy-900)]">
                {email.sender_name || email.sender_email}
              </span>{" "}
              <span className="text-[var(--text-light)]">&lt;{email.sender_email}&gt;</span>
            </div>
            <div className="text-xs text-[var(--text-light)] mt-1">
              Received {new Date(email.received_at).toLocaleString()} ·{" "}
              {connection?.email_address ? `via ${connection.email_address}` : ""}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <ClassificationPill kind={email.ai_classification} />
            {client && (
              <Link
                href={`/clients/${client.id}`}
                className="text-xs font-bold text-[var(--green-600)] hover:underline"
              >
                {client.full_name} →
              </Link>
            )}
          </div>
        </div>

        {email.ai_summary && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm italic text-[var(--text)]">
            🤖 {email.ai_summary}
          </div>
        )}

        {email.ai_suggested_action && (
          <div className="mt-2 text-xs text-[var(--text-muted)]">
            <strong className="text-[var(--navy-900)]">Suggested action:</strong>{" "}
            {email.ai_suggested_action}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-3">
          Email body
        </div>
        <div className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
          {email.snippet || "(no preview available — full body retrieval coming in Phase 6)"}
        </div>
      </div>

      {/* Reply */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {email.reply_sent_at ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-bold text-[var(--navy-900)]">Reply sent</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {new Date(email.reply_sent_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <EmailReplyBox
            emailId={email.id}
            recipient={email.sender_email}
            initialDraft={email.reply_draft}
            initialConfidence={email.reply_draft_confidence}
            initialNeedsHuman={email.reply_draft_needs_human}
          />
        )}
      </div>
    </div>
  );
}

function ClassificationPill({ kind }: { kind: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    document_submission: { label: "📎 Doc Submission", cls: "bg-[var(--green-100)] text-[var(--green-600)]" },
    question: { label: "❓ Question", cls: "bg-[var(--navy-100)] text-[var(--navy-700)]" },
    irs_notice: { label: "⚠️ IRS Notice", cls: "bg-red-100 text-red-700" },
    scheduling: { label: "📅 Scheduling", cls: "bg-amber-100 text-amber-700" },
    spam: { label: "🚫 Spam", cls: "bg-slate-100 text-slate-600" },
    other: { label: "📨 Other", cls: "bg-slate-100 text-slate-600" },
  };
  const meta = map[kind || "other"] || map.other;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
