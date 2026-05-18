"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function EmailReplyBox({
  emailId,
  recipient,
  initialDraft,
  initialConfidence,
  initialNeedsHuman,
}: {
  emailId: string;
  recipient: string;
  initialDraft: string | null;
  initialConfidence: string | null;
  initialNeedsHuman: boolean | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialDraft || "");
  const [confidence, setConfidence] = useState<string | null>(initialConfidence);
  const [needsHuman, setNeedsHuman] = useState<boolean>(initialNeedsHuman || false);
  const [drafting, startDraft] = useTransition();
  const [sending, startSend] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function generateDraft() {
    setError(null);
    setInfo(null);
    const formData = new FormData();
    formData.set("processed_email_id", emailId);
    startDraft(async () => {
      try {
        const res = await fetch("/api/emails/draft", { method: "POST", body: formData });
        const json = await res.json();
        if (!json.ok) {
          setError(json.error || "Draft failed");
          return;
        }
        setBody(json.draft.reply);
        setConfidence(json.draft.confidence);
        setNeedsHuman(!!json.draft.needs_human);
        setInfo(`AI drafted — ${json.draft.confidence} confidence`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Draft failed");
      }
    });
  }

  function send() {
    if (!body.trim()) return;
    setError(null);
    setInfo(null);
    const formData = new FormData();
    formData.set("processed_email_id", emailId);
    formData.set("body", body.trim());
    startSend(async () => {
      try {
        const res = await fetch("/api/emails/send", { method: "POST", body: formData });
        const json = await res.json();
        if (!json.ok) {
          setError(json.error || "Send failed");
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
          Reply to {recipient}
        </div>
        <div className="flex items-center gap-2">
          {confidence && (
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                confidence === "high"
                  ? "bg-[var(--green-100)] text-[var(--green-600)]"
                  : confidence === "medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {confidence}
            </span>
          )}
          {needsHuman && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              ⚠️ Review
            </span>
          )}
          <button
            type="button"
            onClick={generateDraft}
            disabled={drafting}
            className="text-xs font-bold px-3 py-1.5 rounded-md border-2 border-[var(--green-500)] text-[var(--green-600)] hover:bg-[var(--green-100)] transition disabled:opacity-50"
          >
            {drafting ? "Drafting…" : initialDraft ? "🤖 Re-draft" : "🤖 AI Draft"}
          </button>
        </div>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        placeholder="Write your reply, or click AI Draft above…"
        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] text-sm resize-none font-sans leading-relaxed"
      />

      {info && (
        <div className="mt-2 text-xs text-[var(--green-600)]">{info}</div>
      )}
      {error && (
        <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="text-xs text-[var(--text-light)]">
          Sends as &ldquo;Re:&rdquo; threaded reply via your connected inbox.
        </div>
        <button
          onClick={send}
          disabled={sending || !body.trim()}
          className="bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-50 text-sm"
        >
          {sending ? "Sending…" : "Send Reply →"}
        </button>
      </div>
    </div>
  );
}
