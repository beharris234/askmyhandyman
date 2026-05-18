import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReplyBox } from "./ReplyBox";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, clients(id, full_name, email, phone)")
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  // Mark conversation as read
  if ((conversation.unread_count || 0) > 0) {
    await supabase.from("conversations").update({ unread_count: 0 }).eq("id", id);
  }

  const client = conversation.clients as {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
  } | null;
  const latestDraft = messages?.findLast((m) => m.status === "draft" && m.ai_generated);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-4">
        <Link
          href="/messages"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)]"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[var(--navy-900)] truncate">
            {client?.full_name || conversation.display_name || conversation.external_address}
          </div>
          <div className="text-xs text-[var(--text-muted)] truncate">
            <span className="text-xs font-bold uppercase tracking-wider mr-2 px-2 py-0.5 rounded-full bg-[var(--navy-100)] text-[var(--navy-700)]">
              {conversation.channel}
            </span>
            {conversation.external_address}
          </div>
        </div>
        {client && (
          <Link
            href={`/clients/${client.id}`}
            className="text-xs font-bold text-[var(--green-600)] hover:underline shrink-0"
          >
            View client →
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
        {messages && messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-3">
            {messages
              .filter((m) => m.status !== "draft")
              .map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}
          </div>
        ) : (
          <div className="text-center text-sm text-[var(--text-muted)] mt-10">
            No messages in this conversation yet.
          </div>
        )}
      </div>

      {/* Reply box (with AI draft if available) */}
      <div className="bg-white border-t border-slate-200 p-4 sm:p-5">
        <div className="max-w-3xl mx-auto">
          <ReplyBox
            conversationId={conversation.id}
            channel={conversation.channel}
            draft={
              latestDraft
                ? {
                    id: latestDraft.id,
                    body: latestDraft.body,
                    confidence: latestDraft.ai_confidence,
                    needsHuman: (latestDraft.metadata as { needs_human?: boolean } | null)?.needs_human ?? false,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  m,
}: {
  m: {
    id: string;
    direction: string;
    body: string;
    created_at: string;
    ai_generated: boolean;
    status: string;
  };
}) {
  const inbound = m.direction === "inbound";
  return (
    <div className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
          inbound
            ? "bg-white border border-slate-200 text-[var(--navy-900)]"
            : "bg-[var(--navy-900)] text-white"
        }`}
      >
        <div className="text-sm whitespace-pre-wrap leading-snug">{m.body}</div>
        <div className={`text-[10px] mt-1 ${inbound ? "text-[var(--text-light)]" : "text-white/50"}`}>
          {new Date(m.created_at).toLocaleString()}
          {m.ai_generated && !inbound && " · 🤖 AI"}
          {m.status === "failed" && " · ⚠️ failed"}
        </div>
      </div>
    </div>
  );
}
