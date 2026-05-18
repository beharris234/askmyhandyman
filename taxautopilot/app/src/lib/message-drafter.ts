import { anthropic } from "./anthropic";

export type Channel = "sms" | "email";

export type DraftedReply = {
  reply: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  needs_human: boolean;
};

export type DraftInput = {
  channel: Channel;
  clientName?: string | null;
  officeName: string;
  conversationHistory: Array<{
    direction: "inbound" | "outbound";
    body: string;
    created_at: string;
  }>;
  incomingMessage: string;
};

const DRAFTER_PROMPT = `You draft client replies for a tax preparation office. Output ONLY a JSON object — no markdown fences, no prose.

{
  "reply": "<the message to send back, 1-3 sentences for SMS, longer for email>",
  "confidence": "high" | "medium" | "low",
  "reasoning": "<one sentence why you chose this reply>",
  "needs_human": true | false
}

RULES:
1. SMS replies must be SHORT (under 320 chars total / 2 SMS segments). Email replies can be longer.
2. Be warm, professional, and concise. Use the client's first name when known.
3. Sign off with the office name (e.g. "— Johnson Tax Office").
4. NEVER promise a refund amount or specific timing. Use phrases like "typically arrives within 21 days of IRS acceptance".
5. NEVER share or confirm SSNs, bank info, or sensitive numbers via SMS or email.
6. If the question involves complex tax advice, IRS notices, audits, or anything you're uncertain about, set needs_human=true and write a short reply asking the client to wait while the tax pro reviews.
7. If the message is spam or unrelated to tax work, set needs_human=true and write a polite "we don't handle that" reply.
8. Confidence rubric:
   - high: simple status update, scheduling, doc request, generic thank you
   - medium: standard question with a clear answer you can give
   - low: anything sensitive, ambiguous, or requiring human judgment`;

export async function draftReply(input: DraftInput): Promise<DraftedReply> {
  const historyBlock = input.conversationHistory
    .slice(-6)
    .map((m) => `${m.direction === "inbound" ? "Client" : "Office"}: ${m.body}`)
    .join("\n");

  const userPrompt = `Channel: ${input.channel.toUpperCase()}
Office: ${input.officeName}
Client name: ${input.clientName ?? "(unknown — match by phone/email only)"}

Recent conversation:
${historyBlock || "(no prior messages)"}

New incoming message from client:
"${input.incomingMessage}"

Draft a reply.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: [
      { type: "text", text: DRAFTER_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    return fallback("Drafter returned no text");
  }
  const raw = text.text.trim();
  const jsonText = stripCodeFences(raw);
  try {
    return JSON.parse(jsonText) as DraftedReply;
  } catch {
    return fallback(`Drafter returned non-JSON: ${raw.slice(0, 100)}`);
  }
}

function fallback(reason: string): DraftedReply {
  return {
    reply: "Thanks for reaching out. We'll get back to you shortly.",
    confidence: "low",
    reasoning: reason,
    needs_human: true,
  };
}

function stripCodeFences(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : text;
}
