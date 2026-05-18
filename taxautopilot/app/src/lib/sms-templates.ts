/**
 * SMS templates for the refund-tracking lifecycle.
 *
 * The cron picks the right template based on the days since
 * filing and the current_status. Templates are rendered with
 * simple {var} substitution.
 */

export type TemplateVars = {
  first_name: string;
  office_name: string;
  tax_year: string;
  refund_amount?: string;
  bank_last4?: string;
  days_since_filed?: number;
  review_link?: string;
};

export type RefundTemplate = {
  id: string;
  label: string;
  body: (v: TemplateVars) => string;
  /** Days after filed_date to schedule. Null = trigger-based, not date-based. */
  scheduleOffsetDays: number | null;
  /** Skip if current status >= this point in the lifecycle. */
  skipIfStatusInOrPast?: string[];
};

const RECEIVED_STATES = ["received", "issue"];

export const REFUND_TEMPLATES: RefundTemplate[] = [
  {
    id: "refund_day_0_filed",
    label: "Filed confirmation (day 0)",
    scheduleOffsetDays: 0,
    body: (v) =>
      `Hi ${v.first_name}! Your ${v.tax_year} return is filed. The IRS typically accepts within 24-48 hrs. We'll text you the moment they do. — ${v.office_name}`,
    skipIfStatusInOrPast: ["accepted", "rejected", ...RECEIVED_STATES],
  },
  {
    id: "refund_day_3_accepted_check",
    label: "Acceptance window check (day 3)",
    scheduleOffsetDays: 3,
    body: (v) =>
      `Hi ${v.first_name}, the IRS usually accepts returns within 1-2 days. We'll confirm yours shortly. Refund typically arrives within 21 days of acceptance. — ${v.office_name}`,
    skipIfStatusInOrPast: ["accepted", "refund_approved", "refund_sent", ...RECEIVED_STATES],
  },
  {
    id: "refund_day_14_midprocess",
    label: "Mid-process check-in (day 14)",
    scheduleOffsetDays: 14,
    body: (v) =>
      `Hi ${v.first_name}, quick update — your ${v.refund_amount ?? ""}${v.refund_amount ? " " : ""}refund is in the standard IRS processing window. Should arrive in the next 7-14 days. — ${v.office_name}`,
    skipIfStatusInOrPast: ["refund_sent", ...RECEIVED_STATES],
  },
  {
    id: "refund_day_21_expected",
    label: "Expected arrival (day 21)",
    scheduleOffsetDays: 21,
    body: (v) =>
      `${v.first_name}, today is the typical 21-day mark for your refund. If you've already received it, no need to reply. If not, give it a few more days — we're watching. — ${v.office_name}`,
    skipIfStatusInOrPast: RECEIVED_STATES,
  },
  {
    id: "refund_day_28_overdue",
    label: "Overdue check (day 28)",
    scheduleOffsetDays: 28,
    body: (v) =>
      `Hi ${v.first_name}, your refund is past the typical window. Reply YES if it landed, NO if it hasn't. We'll dig in if needed. — ${v.office_name}`,
    skipIfStatusInOrPast: RECEIVED_STATES,
  },
];

export const TRIGGER_TEMPLATES: Record<string, (v: TemplateVars) => string> = {
  status_accepted: (v) =>
    `Great news ${v.first_name}! The IRS just accepted your ${v.tax_year} return. Your ${v.refund_amount ?? ""}${v.refund_amount ? " " : ""}refund typically arrives within 21 days. — ${v.office_name}`,

  status_rejected: (v) =>
    `Hi ${v.first_name}, the IRS rejected your return — usually a quick fix. We'll reach out today to correct it and re-file. — ${v.office_name}`,

  status_refund_sent: (v) =>
    `${v.first_name}! The IRS just released your ${v.refund_amount ?? ""}${v.refund_amount ? " " : ""}refund. Direct deposit usually shows up in 1-5 business days${v.bank_last4 ? ` in your account ending ${v.bank_last4}` : ""}. — ${v.office_name}`,

  status_received: (v) =>
    `Awesome ${v.first_name}! Your refund landed. If you have a sec, a quick Google review means the world to us${v.review_link ? `: ${v.review_link}` : ""}. — ${v.office_name}`,

  status_issue: (v) =>
    `Hi ${v.first_name}, your refund has run into an IRS hiccup. We're on it — we'll be in touch with next steps today. — ${v.office_name}`,
};

export function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
