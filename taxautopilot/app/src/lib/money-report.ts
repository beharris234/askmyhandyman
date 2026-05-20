import { anthropic } from "./anthropic";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Finding = {
  category: FindingCategory;
  count: number;
  estimated_value: number;
  unit_value: number;
  unit_label: string;
  summary: string;
  detail_blurb: string; // what's locked behind subscribe
};

export type FindingCategory =
  | "lapsed_clients"
  | "amendable_returns"
  | "quarterly_opportunities"
  | "irs_notices"
  | "offseason_silence"
  | "email_backlog";

export type ReportFindings = {
  lapsed_clients: Finding;
  amendable_returns: Finding;
  quarterly_opportunities: Finding;
  irs_notices: Finding;
  offseason_silence: Finding;
  email_backlog: Finding;
};

/**
 * Run the full Money Report analysis on an organization's data.
 * Returns 6 findings + total estimated dollar value.
 */
export async function runMoneyReport(
  supabase: SupabaseClient,
  orgId: string
): Promise<{ findings: ReportFindings; total: number; ai_summary: string }> {
  const currentYear = new Date().getFullYear();

  // Pull all the data we'll analyze
  const [clientsResult, refundTracksResult, processedEmailsResult, messagesResult] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, email, phone, last_filed_year, status, created_at")
        .eq("organization_id", orgId),
      supabase
        .from("refund_tracks")
        .select("client_id, tax_year, refund_amount, current_status")
        .eq("organization_id", orgId),
      supabase
        .from("processed_emails")
        .select("id, ai_classification, status, received_at")
        .eq("organization_id", orgId),
      supabase
        .from("messages")
        .select("client_id, direction, created_at")
        .eq("organization_id", orgId),
    ]);

  const clients = clientsResult.data || [];
  const refundTracks = refundTracksResult.data || [];
  const processedEmails = processedEmailsResult.data || [];
  const messages = messagesResult.data || [];

  // Compute last filed year per client (from refund_tracks max OR last_filed_year)
  const lastYearByClient = new Map<string, number>();
  for (const t of refundTracks) {
    const y = parseInt(t.tax_year, 10);
    if (Number.isNaN(y)) continue;
    const existing = lastYearByClient.get(t.client_id);
    if (!existing || y > existing) lastYearByClient.set(t.client_id, y);
  }

  // === 1. LAPSED CLIENTS (haven't filed in 1+ years) ===
  let lapsedCount = 0;
  for (const c of clients) {
    if (c.status === "archived") continue;
    const fromTrack = lastYearByClient.get(c.id);
    const fromField = c.last_filed_year ? parseInt(c.last_filed_year, 10) : null;
    const computed = fromTrack ?? fromField;
    if (computed && currentYear - computed >= 1) lapsedCount++;
    // If we have no filing data AND created over 1 year ago, also count
    else if (!computed && new Date(c.created_at).getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000) {
      lapsedCount++;
    }
  }
  const lapsedValue = lapsedCount * 500; // avg return fee

  // === 2. AMENDABLE RETURNS (3-year window, refund < $200 suggests missed credits) ===
  let amendableCount = 0;
  for (const r of refundTracks) {
    const y = parseInt(r.tax_year, 10);
    if (Number.isNaN(y)) continue;
    if (currentYear - y > 3) continue; // outside IRS amendment window
    if (r.refund_amount == null) continue;
    if (parseFloat(String(r.refund_amount)) < 200) amendableCount++;
  }
  const amendableValue = amendableCount * 400; // avg amendment fee to office

  // === 3. QUARTERLY TAX OPPORTUNITIES (estimated 30% of clients are Schedule C / S-corp) ===
  const activeClientCount = clients.filter((c) => c.status !== "archived").length;
  const quarterlyCount = Math.round(activeClientCount * 0.3);
  const quarterlyValue = quarterlyCount * 100 * 4; // $100/quarter avg

  // === 4. IRS NOTICES SEEN BUT NOT MONETIZED ===
  const irsNoticesCount = processedEmails.filter(
    (e) => e.ai_classification === "irs_notice"
  ).length;
  const irsNoticesValue = irsNoticesCount * 300;

  // === 5. OFF-SEASON SILENCE (clients with no May-Dec messages) ===
  const offseasonStart = new Date(currentYear, 4, 1).getTime(); // May 1
  const offseasonEnd = new Date(currentYear, 11, 31).getTime();
  const clientsWithMessages = new Set<string>();
  for (const m of messages) {
    if (!m.client_id) continue;
    const t = new Date(m.created_at).getTime();
    if (t >= offseasonStart && t <= offseasonEnd) clientsWithMessages.add(m.client_id);
  }
  const silentCount = Math.max(activeClientCount - clientsWithMessages.size, 0);
  const silentValue = silentCount * 75; // proxy: avg added rev from re-engagement

  // === 6. EMAIL BACKLOG (unanswered client emails AI could handle) ===
  const emailBacklogCount = processedEmails.filter(
    (e) => e.status === "needs_action"
  ).length;
  // Each email = ~5 min of preparer time @ $100/hr = $8.33 of time saved
  const emailBacklogValue = Math.round(emailBacklogCount * 8.33);

  const findings: ReportFindings = {
    lapsed_clients: {
      category: "lapsed_clients",
      count: lapsedCount,
      estimated_value: lapsedValue,
      unit_value: 500,
      unit_label: "avg return fee",
      summary: `${lapsedCount} clients who haven't filed with you in 1+ years. Average tax pro recovers ~40% of these with the right outreach.`,
      detail_blurb: `Unlock the full list of names, contact info, and AI-drafted win-back text/email for each one.`,
    },
    amendable_returns: {
      category: "amendable_returns",
      count: amendableCount,
      estimated_value: amendableValue,
      unit_value: 400,
      unit_label: "per amendment",
      summary: `${amendableCount} returns from the last 3 years with low refunds that might qualify for credits you can still amend.`,
      detail_blurb: `Unlock the per-client analysis showing which credits to claim (EITC, education credits, etc.) and your fee opportunity per amendment.`,
    },
    quarterly_opportunities: {
      category: "quarterly_opportunities",
      count: quarterlyCount,
      estimated_value: quarterlyValue,
      unit_value: 100,
      unit_label: "per quarterly filing",
      summary: `~${quarterlyCount} clients (estimated 30%) are Schedule C / S-corp and should be paying you $75-150 per quarterly estimated tax filing. 4 quarters = recurring revenue.`,
      detail_blurb: `Unlock the auto-text reminders that fire before every quarterly deadline + the workflow to bill for each filing.`,
    },
    irs_notices: {
      category: "irs_notices",
      count: irsNoticesCount,
      estimated_value: irsNoticesValue,
      unit_value: 300,
      unit_label: "avg notice response fee",
      summary: `${irsNoticesCount} IRS notice emails we detected. Most tax offices charge $200-500 to respond — easy money you may not have captured.`,
      detail_blurb: `Unlock the AI-drafted CP2000/audit-response templates and the auto-followup workflow.`,
    },
    offseason_silence: {
      category: "offseason_silence",
      count: silentCount,
      estimated_value: silentValue,
      unit_value: 75,
      unit_label: "estimated added rev per client",
      summary: `${silentCount} clients haven't heard from you May–December. Tax pros who stay in touch year-round see 20-30% more renewal revenue.`,
      detail_blurb: `Unlock the off-season touchpoint schedule (life-event check-ins, mid-year planning, holiday cards) automated for every client.`,
    },
    email_backlog: {
      category: "email_backlog",
      count: emailBacklogCount,
      estimated_value: emailBacklogValue,
      unit_value: 8,
      unit_label: "$ of preparer time per email",
      summary: `${emailBacklogCount} client emails we flagged that AI could have answered for you. At 5 min each, that's ${Math.round((emailBacklogCount * 5) / 60)} hours of your life back.`,
      detail_blurb: `Unlock AI auto-replies — drafts every response, you click approve, sent in seconds.`,
    },
  };

  const total =
    lapsedValue +
    amendableValue +
    quarterlyValue +
    irsNoticesValue +
    silentValue +
    emailBacklogValue;

  // Generate an AI-written executive summary
  const ai_summary = await generateExecutiveSummary(findings, total, activeClientCount);

  return { findings, total, ai_summary };
}

async function generateExecutiveSummary(
  findings: ReportFindings,
  total: number,
  clientCount: number
): Promise<string> {
  const summaryPrompt = `You're writing the opening paragraph of a "Money Left on the Table" report for a tax preparation office. Be punchy, specific, dollar-driven. 2-3 sentences max.

Office stats:
- Total clients: ${clientCount}
- Lapsed clients: ${findings.lapsed_clients.count} ($${findings.lapsed_clients.estimated_value})
- Amendable returns: ${findings.amendable_returns.count} ($${findings.amendable_returns.estimated_value})
- Quarterly opportunities: ${findings.quarterly_opportunities.count} ($${findings.quarterly_opportunities.estimated_value})
- IRS notices: ${findings.irs_notices.count} ($${findings.irs_notices.estimated_value})
- Off-season silence: ${findings.offseason_silence.count} clients ($${findings.offseason_silence.estimated_value})
- Email backlog: ${findings.email_backlog.count} emails ($${findings.email_backlog.estimated_value})
- TOTAL OPPORTUNITY: $${total}

Write 2-3 sentences that:
1. Lead with the total dollar amount (make it vivid)
2. Highlight the 1-2 biggest categories
3. End with a punchy line about what they could be doing instead

Tone: warm, professional, not pushy. Like a trusted advisor showing them something they'll be glad they saw.

Output ONLY the paragraph text, no headers, no JSON, no quotes.`;

  try {
    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: summaryPrompt }],
    });
    const text = result.content.find((b) => b.type === "text");
    if (text && text.type === "text") return text.text.trim();
  } catch {
    // Fall through to default
  }

  return total > 0
    ? `Looking at your office, we found approximately $${total.toLocaleString("en-US")} in revenue opportunities that may have been missed last year. The biggest gaps are in lapsed-client recovery and untapped quarterly tax fees — both are fully addressable with the right system.`
    : `Your office is in good shape! We didn't find significant missed revenue opportunities — keep doing what you're doing.`;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
