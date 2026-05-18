import { anthropic } from "./anthropic";

export type EmailDraftedReply = {
  reply: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  needs_human: boolean;
};

export type EmailDraftInput = {
  clientName?: string | null;
  preparerName: string;
  officeName: string;
  incomingFrom: string;
  incomingSubject: string;
  incomingBody: string;
  classification: string;
  conversationHistory?: Array<{ direction: "inbound" | "outbound"; body: string }>;
};

const EMAIL_DRAFTER_PROMPT = `You draft email replies for a tax preparation office. Output ONLY a JSON object — no markdown fences, no prose around it.

{
  "reply": "<the full email body as plain text — include a greeting and a signoff line. Skip any subject; we add 'Re: ' to the original.>",
  "confidence": "high" | "medium" | "low",
  "reasoning": "<one sentence why you chose this reply>",
  "needs_human": true | false
}

RULES:
1. Tone is warm, professional, concise. Use the client's first name when known.
2. Sign off as the preparer ("Marcus — Johnson Tax Office") or just the office if no preparer name.
3. NEVER promise a refund amount or specific arrival date. Use "typically within 21 days of IRS acceptance".
4. NEVER share or confirm SSNs, bank info, or sensitive numbers via email.
5. If they're asking about a doc you can't see, ask them to upload via your secure client portal — don't say to email it.
6. For IRS notices: acknowledge receipt, say "we'll review and reach out today/tomorrow with next steps", set needs_human=true.
7. For complex tax advice, audits, or anything outside basic status/scheduling/doc-collection: needs_human=true with a "thanks, we'll review and get back to you" reply.
8. For spam/marketing: very short polite "we don't handle that" reply, needs_human=true.
9. Confidence rubric:
   - high: simple status update, scheduling, generic doc request, thank-yous
   - medium: standard question you can answer fully
   - low: anything sensitive, ambiguous, or requiring human judgment
10. Keep it under 8 sentences unless the client asked a multi-part question.`;

export async function draftEmailReply(input: EmailDraftInput): Promise<EmailDraftedReply> {
  const historyBlock = (input.conversationHistory || [])
    .slice(-4)
    .map((m) => `${m.direction === "inbound" ? "Client" : "Office"}: ${m.body.slice(0, 400)}`)
    .join("\n");

  const userPrompt = `Office: ${input.officeName}
Preparer (sign-off): ${input.preparerName}
Client name: ${input.clientName ?? "(unknown)"}
Classification: ${input.classification}

${historyBlock ? `Recent prior exchanges:\n${historyBlock}\n\n` : ""}New email FROM: ${input.incomingFrom}
SUBJECT: ${input.incomingSubject}

BODY:
${input.incomingBody.slice(0, 4000)}

Draft a reply.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: [
      { type: "text", text: EMAIL_DRAFTER_PROMPT, cache_control: { type: "ephemeral" } },
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
    return JSON.parse(jsonText) as EmailDraftedReply;
  } catch {
    return fallback(`Drafter returned non-JSON: ${raw.slice(0, 100)}`);
  }
}

function fallback(reason: string): EmailDraftedReply {
  return {
    reply: "Thanks for reaching out — we'll review and get back to you shortly.",
    confidence: "low",
    reasoning: reason,
    needs_human: true,
  };
}

function stripCodeFences(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : text;
}
