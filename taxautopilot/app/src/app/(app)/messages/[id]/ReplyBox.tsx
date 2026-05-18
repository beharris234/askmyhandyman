"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Draft = {
  id: string;
  body: string;
  confidence: string | null;
  needsHuman: boolean;
};

export function ReplyBox({
  conversationId,
  channel,
  draft,
}: {
  conversationId: string;
  channel: string;
  draft: Draft | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState(draft?.body || "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isSms = channel === "sms";
  const overLimit = isSms && body.length > 320;

  async function send() {
    if (!body.trim()) return;
    setError(null);
    const formData = new FormData();
    formData.set("conversation_id", conversationId);
    formData.set("body", body.trim());
    if (draft?.id) formData.set("draft_id", draft.id);
    startTransition(async () => {
      try {
        const res = await fetch("/api/messages/send", { method: "POST", body: formData });
        const json = await res.json();
        if (!json.ok) {
          setError(json.error || "Send failed");
          return;
        }
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
      }
    });
  }

  return (
    <div>
      {draft && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="font-bold text-[var(--green-600)]">🤖 AI Drafted</span>
          {draft.confidence && (
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                draft.confidence === "high"
                  ? "bg-[var(--green-100)] text-[var(--green-600)]"
                  : draft.confidence === "medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {draft.confidence}
            </span>
          )}
          {draft.needsHuman && (
            <span className="text-[var(--text-muted)] italic">⚠️ flagged for human review</span>
          )}
          <button
            type="button"
            onClick={() => setBody(draft.body)}
            className="ml-auto text-[var(--text-muted)] hover:text-[var(--navy-900)] underline"
          >
            Restore draft
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={`Reply via ${channel.toUpperCase()}…`}
          className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] text-sm resize-none"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
          }}
        />
        <button
          onClick={send}
          disabled={pending || !body.trim() || overLimit}
          className="bg-[var(--navy-900)] text-white font-bold px-5 py-3 rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-50 shrink-0"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="text-[10px] text-[var(--text-muted)]">⌘+Enter to send</div>
        {isSms && (
          <div className={`text-xs ${overLimit ? "text-red-600 font-bold" : "text-[var(--text-light)]"}`}>
            {body.length} / 320 chars
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
