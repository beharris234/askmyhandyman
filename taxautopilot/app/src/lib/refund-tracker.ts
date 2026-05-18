import { REFUND_TEMPLATES, TRIGGER_TEMPLATES, type TemplateVars } from "./sms-templates";

/**
 * IRS typical processing timeline (based on 2024-2025 IRS guidance):
 *   - E-file accepted within 24-48 hrs
 *   - Refund approved within 2-3 weeks of acceptance
 *   - Direct deposit lands 1-5 business days after release
 *   - Paper check takes 4-6 weeks total
 */
const IRS_DIRECT_DEPOSIT_DAYS = 21;
const IRS_CHECK_DAYS = 42;
const IRS_ACCEPTANCE_DAYS = 2;

export type RefundTrackInput = {
  filedDate: Date;
  refundMethod: "direct_deposit" | "check";
};

export function computeExpectedDates(input: RefundTrackInput): {
  expectedAcceptance: Date;
  expectedRefund: Date;
} {
  const acceptance = new Date(input.filedDate);
  acceptance.setDate(acceptance.getDate() + IRS_ACCEPTANCE_DAYS);

  const refund = new Date(input.filedDate);
  const refundDays = input.refundMethod === "check" ? IRS_CHECK_DAYS : IRS_DIRECT_DEPOSIT_DAYS;
  refund.setDate(refund.getDate() + refundDays);

  return { expectedAcceptance: acceptance, expectedRefund: refund };
}

export type ScheduledMessageSpec = {
  template_id: string;
  body: string;
  scheduled_for: Date;
};

/**
 * Given a freshly-created refund_track, generate the full schedule
 * of date-based SMS alerts the cron will fire.
 */
export function buildSchedule(
  filedDate: Date,
  vars: TemplateVars,
  sendHourLocal = 10 // morning send time, in office's local hour-of-day
): ScheduledMessageSpec[] {
  const schedule: ScheduledMessageSpec[] = [];
  for (const tpl of REFUND_TEMPLATES) {
    if (tpl.scheduleOffsetDays === null) continue;
    const scheduled = new Date(filedDate);
    scheduled.setDate(scheduled.getDate() + tpl.scheduleOffsetDays);
    scheduled.setHours(sendHourLocal, 0, 0, 0);
    // Skip if already in the past more than 2 hours
    if (scheduled.getTime() < Date.now() - 2 * 60 * 60 * 1000) continue;
    schedule.push({
      template_id: tpl.id,
      body: tpl.body(vars),
      scheduled_for: scheduled,
    });
  }
  return schedule;
}

export function shouldSkipForStatus(templateId: string, currentStatus: string): boolean {
  const tpl = REFUND_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl?.skipIfStatusInOrPast) return false;
  return tpl.skipIfStatusInOrPast.includes(currentStatus);
}

export function renderTriggerMessage(
  trigger: keyof typeof TRIGGER_TEMPLATES,
  vars: TemplateVars
): string | null {
  const fn = TRIGGER_TEMPLATES[trigger];
  return fn ? fn(vars) : null;
}

/**
 * Status flow rank — used to prevent regression (e.g. going from
 * 'received' back to 'accepted' shouldn't fire 'accepted' triggers).
 */
const STATUS_ORDER = [
  "filed",
  "accepted",
  "processing",
  "refund_approved",
  "refund_sent",
  "received",
];

export function isStatusForward(from: string, to: string): boolean {
  const fromIdx = STATUS_ORDER.indexOf(from);
  const toIdx = STATUS_ORDER.indexOf(to);
  if (toIdx === -1) return true;
  return toIdx > fromIdx;
}

export function statusForTriggerKey(status: string): keyof typeof TRIGGER_TEMPLATES | null {
  switch (status) {
    case "accepted": return "status_accepted";
    case "rejected": return "status_rejected";
    case "refund_sent": return "status_refund_sent";
    case "received": return "status_received";
    case "issue": return "status_issue";
    default: return null;
  }
}

export function formatRefundAmount(amount: number | string | null | undefined): string | undefined {
  if (amount == null || amount === "") return undefined;
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return undefined;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0];
}
