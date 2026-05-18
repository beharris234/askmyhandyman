import { anthropic } from "./anthropic";

export type AudienceCriteria = {
  lapsed_years_min: number;
  require_phone?: boolean;
  require_email?: boolean;
  include_archived?: boolean;
};

export type Channel = "sms" | "email" | "both";

export type ClientForAudience = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  last_filed_year: string | null;
};

export type ClientWithLastYear = ClientForAudience & {
  computed_last_year: number | null;
  years_lapsed: number;
};

/**
 * Take an org's full client list + their max refund_tracks.tax_year
 * and return the ones who match the audience criteria.
 */
export function filterAudience(
  clients: ClientForAudience[],
  lastYearByClientId: Map<string, number>,
  criteria: AudienceCriteria,
  channel: Channel
): ClientWithLastYear[] {
  const currentYear = new Date().getFullYear();
  const includeArchived = criteria.include_archived ?? false;

  const result: ClientWithLastYear[] = [];
  for (const c of clients) {
    if (!includeArchived && c.status === "archived") continue;

    const trackYear = lastYearByClientId.get(c.id);
    const fallbackYear = c.last_filed_year ? parseInt(c.last_filed_year, 10) : null;
    const computed = trackYear ?? fallbackYear;
    const yearsLapsed = computed == null ? Infinity : currentYear - computed;

    if (yearsLapsed < criteria.lapsed_years_min) continue;

    const wantSms = channel === "sms" || channel === "both";
    const wantEmail = channel === "email" || channel === "both";
    if (wantSms && criteria.require_phone !== false && !c.phone) continue;
    if (wantEmail && criteria.require_email !== false && !c.email) continue;

    result.push({
      ...c,
      computed_last_year: computed,
      years_lapsed: yearsLapsed,
    });
  }

  // Sort by most-lapsed first — biggest opportunity gets messaged first
  return result.sort((a, b) => b.years_lapsed - a.years_lapsed);
}

// ============================================================
// AI MESSAGE GENERATION
// ============================================================

export type GeneratedMessage = {
  subject?: string;
  body: string;
};

const WINBACK_PROMPT = `You write warm, no-pressure win-back outreach from a tax preparation office to a lapsed client.

Output ONLY a JSON object — no markdown fences:

{
  "subject": "<email only — short and human, not salesy>",
  "body": "<the message body>"
}

RULES:
1. Tone: warm, casual, no guilt. We miss them, we'd love to help.
2. Lead with value:
   - 1 year lapsed: "didn't see you this year — want help getting filed?"
   - 2-3 years lapsed: "been a minute — let's catch up, including any years you missed"
   - 4+ years lapsed: mention the 3-year amendment window (up to 3 prior years are still amendable for refunds they may have missed)
3. SMS body must be under 280 chars total. Email body 4-7 sentences.
4. Use the client's first name.
5. Sign off with the office name.
6. NEVER claim a specific refund amount. NEVER promise tax outcomes.
7. End with ONE clear CTA: "reply YES to set up a quick call" (SMS) or "reply to this email and we'll get you on the calendar" (email).
8. Don't include "subject" key for SMS messages.`;

export type GenerateMessageInput = {
  channel: "sms" | "email";
  clientFirstName: string;
  officeName: string;
  yearsLapsed: number;
  lastFiledYear: number | null;
};

export async function generateWinbackMessage(
  input: GenerateMessageInput
): Promise<GeneratedMessage> {
  const userPrompt = `Channel: ${input.channel.toUpperCase()}
Client first name: ${input.clientFirstName}
Office name: ${input.officeName}
Years lapsed: ${input.yearsLapsed === Infinity ? "Unknown (never filed with us before)" : input.yearsLapsed}
Last filed year: ${input.lastFiledYear ?? "Unknown"}

Write the message.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: [
      { type: "text", text: WINBACK_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    return fallback(input);
  }
  const raw = text.text.trim();
  const jsonText = stripCodeFences(raw);
  try {
    return JSON.parse(jsonText) as GeneratedMessage;
  } catch {
    return fallback(input);
  }
}

function fallback(input: GenerateMessageInput): GeneratedMessage {
  if (input.channel === "sms") {
    return {
      body: `Hi ${input.clientFirstName}, it's ${input.officeName}. We noticed it's been a while since we filed for you — would love to help you get caught up. Reply YES to set up a quick call.`,
    };
  }
  return {
    subject: `Thinking of you, ${input.clientFirstName}`,
    body: `Hi ${input.clientFirstName},\n\nIt's been a while since we worked on your taxes together. We'd love to help you get caught up — and if there are any prior years still amendable, we can take a look at those too.\n\nReply to this email and we'll get you on the calendar.\n\n— ${input.officeName}`,
  };
}

function stripCodeFences(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : text;
}

export function firstNameOf(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0];
}
