"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "How do I import my client list?",
  "How do I connect Gmail?",
  "How do I set up Twilio?",
  "How do referrals work?",
];

export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist conversation across pages
  useEffect(() => {
    const saved = sessionStorage.getItem("ta_assistant_chat");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("ta_assistant_chat", JSON.stringify(messages));
    // auto-scroll
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function send(text: string) {
    if (!text.trim() || pending) return;
    const next: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: next, path: pathname }),
        });
        const body = await res.json();
        if (!body.ok) {
          setMessages([
            ...next,
            { role: "assistant", content: `⚠️ ${body.error || "Something broke. Try again?"}` },
          ]);
          return;
        }
        setMessages([...next, { role: "assistant", content: body.reply }]);
      } catch (err) {
        setMessages([
          ...next,
          {
            role: "assistant",
            content: `⚠️ ${err instanceof Error ? err.message : "Network error"}`,
          },
        ]);
      }
    });
  }

  function clearChat() {
    setMessages([]);
    sessionStorage.removeItem("ta_assistant_chat");
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition ${
          open
            ? "bg-slate-700 text-white"
            : "bg-gradient-to-br from-[var(--navy-900)] to-[var(--green-600)] text-white hover:scale-110"
        }`}
        aria-label="Setup assistant"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[calc(100vw-2.5rem)] sm:w-[400px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--navy-900)] to-[var(--navy-700)] text-white p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">TaxAutopilot Helper 🤖</div>
              <div className="text-[10px] text-white/60">Ask anything — setup, features, billing</div>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="text-[10px] text-white/60 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50"
            style={{ minHeight: "300px" }}
          >
            {messages.length === 0 ? (
              <div>
                <div className="text-sm text-[var(--text-muted)] mb-3">
                  👋 Hey! I&apos;m here to help you get TaxAutopilot set up. Ask me anything.
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                    Common questions:
                  </div>
                  {STARTER_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="block w-full text-left text-xs bg-white border border-slate-200 rounded-md p-2 hover:border-[var(--green-500)] transition text-[var(--navy-900)]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => <Bubble key={i} m={m} />)
            )}
            {pending && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <div className="w-2 h-2 rounded-full bg-[var(--green-500)] animate-pulse" />
                Thinking…
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything…"
                className="flex-1 px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-sm text-[var(--navy-900)]"
                disabled={pending}
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="bg-[var(--navy-900)] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[var(--green-600)] transition disabled:opacity-50"
              >
                →
              </button>
            </form>
            <div className="text-[10px] text-[var(--text-light)] mt-1.5">
              Powered by Claude · Knows your current setup state
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ m }: { m: Message }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isUser
            ? "bg-[var(--navy-900)] text-white"
            : "bg-white border border-slate-200 text-[var(--navy-900)]"
        }`}
      >
        {isUser ? (
          <div>{m.content}</div>
        ) : (
          <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs">
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
