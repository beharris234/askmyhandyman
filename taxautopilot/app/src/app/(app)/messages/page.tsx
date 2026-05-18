import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, clients(id, full_name)")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight">
            Messages
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Conversations with your clients. AI drafts replies you can approve in one click.
          </p>
        </div>
        <Link
          href="/settings/twilio"
          className="text-xs font-bold text-[var(--green-600)] hover:underline"
        >
          Twilio settings →
        </Link>
      </div>

      {conversations && conversations.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {conversations.map((c) => {
            const client = c.clients as { id: string; full_name: string } | null;
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="block p-4 sm:p-5 hover:bg-slate-50 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--navy-100)] flex items-center justify-center font-bold text-[var(--navy-900)] shrink-0">
                    {(c.display_name || c.external_address || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--navy-100)] text-[var(--navy-700)]">
                        {c.channel}
                      </span>
                      <div className="font-bold text-[var(--navy-900)] truncate">
                        {client?.full_name || c.display_name || c.external_address}
                      </div>
                      {c.unread_count > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--green-500)] text-white">
                          {c.unread_count} new
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {c.external_address}
                    </div>
                    {c.last_message_preview && (
                      <div className="text-sm text-[var(--text)] mt-1 line-clamp-1">
                        {c.last_message_preview}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-light)] shrink-0">
                    {c.last_message_at && timeAgo(c.last_message_at)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-3 opacity-40">💬</div>
          <h3 className="font-bold text-[var(--navy-900)] mb-1">No conversations yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-5 max-w-md mx-auto">
            Once you connect your Twilio number and clients start texting, every
            thread shows up here with an AI-drafted reply waiting.
          </p>
          <Link
            href="/settings/twilio"
            className="inline-block bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
          >
            Connect Twilio →
          </Link>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
