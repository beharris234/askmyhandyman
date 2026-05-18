import { anthropic } from "./anthropic";

export type EmailClassification = {
  classification: "document_submission" | "question" | "irs_notice" | "scheduling" | "spam" | "other";
  summary: string;
  suggested_action: string;
};

const CLASSIFIER_PROMPT = `You classify emails arriving at a tax preparation office. Return ONLY a JSON object with this exact shape, no fences:

{
  "classification": "document_submission" | "question" | "irs_notice" | "scheduling" | "spam" | "other",
  "summary": "<one sentence, 12 words max>",
  "suggested_action": "<what the tax pro should do, 15 words max>"
}

Categories:
- document_submission: client sent W-2, 1099, ID, or other tax doc (especially with attachments)
- question: client asking about their refund, return status, fees, or other tax question
- irs_notice: client received an IRS letter (CP2000, audit notice, etc.) and is asking for help
- scheduling: appointment booking, meeting requests, calendar coordination
- spam: marketing, newsletters, vendor outreach, unrelated to tax work
- other: anything else tax-relevant that doesn't fit the above

Return JSON only.`;

export async function classifyEmail(input: {
  subject: string;
  snippet: string;
  body: string;
  hasAttachments: boolean;
  senderEmail: string;
}): Promise<EmailClassification> {
  const userPrompt = `Subject: ${input.subject}
From: ${input.senderEmail}
Has attachments: ${input.hasAttachments ? "yes" : "no"}

${input.body || input.snippet || "(no body)"}`.slice(0, 4000);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: [
      { type: "text", text: CLASSIFIER_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    return fallback("Classifier returned no text");
  }
  const raw = text.text.trim();
  const jsonText = stripCodeFences(raw);

  try {
    return JSON.parse(jsonText) as EmailClassification;
  } catch {
    return fallback(`Classifier returned non-JSON: ${raw.slice(0, 120)}`);
  }
}

function fallback(reason: string): EmailClassification {
  return {
    classification: "other",
    summary: "Unclassified",
    suggested_action: `Manual review needed — ${reason}`,
  };
}

function stripCodeFences(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : text;
}
