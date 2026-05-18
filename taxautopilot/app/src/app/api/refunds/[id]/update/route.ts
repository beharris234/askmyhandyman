import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  firstName,
  formatRefundAmount,
  isStatusForward,
  renderTriggerMessage,
  statusForTriggerKey,
} from "@/lib/refund-tracker";

export const runtime = "nodejs";

const ALLOWED_STATUSES = [
  "filed",
  "accepted",
  "rejected",
  "processing",
  "refund_approved",
  "refund_sent",
  "received",
  "issue",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organizations(name)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }

  const form = await request.formData();
  const newStatus = String(form.get("status") || "");
  const notes = String(form.get("notes") || "").trim() || null;

  if (!ALLOWED_STATUSES.includes(newStatus)) {
    return NextResponse.json(
      { ok: false, error: `Invalid status. Must be one of ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const { data: track } = await supabase
    .from("refund_tracks")
    .select("*, clients(id, full_name)")
    .eq("id", id)
    .single();
  if (!track || track.organization_id !== profile.organization_id) {
    return NextResponse.json({ ok: false, error: "track not found" }, { status: 404 });
  }

  const oldStatus = track.current_status;
  const isForward = isStatusForward(oldStatus, newStatus);

  // Update the track (trigger will log to history)
  const { error: updateErr } = await supabase
    .from("refund_tracks")
    .update({
      current_status: newStatus,
      status_updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateErr) {
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  if (notes) {
    await supabase.from("refund_status_history").insert({
      refund_track_id: id,
      organization_id: profile.organization_id,
      from_status: oldStatus,
      to_status: newStatus,
      notes,
      source: "manual",
      changed_by: user.id,
    });
  }

  // Fire trigger SMS only on forward transitions to alert-worthy statuses
  let triggerScheduled = false;
  if (isForward && track.alerts_enabled) {
    const triggerKey = statusForTriggerKey(newStatus);
    if (triggerKey) {
      const client = track.clients as { id: string; full_name: string } | null;
      const orgName =
        (profile.organizations as { name?: string } | null)?.name ?? "your tax office";
      const body = renderTriggerMessage(triggerKey, {
        first_name: firstName(client?.full_name),
        office_name: orgName,
        tax_year: track.tax_year,
        refund_amount: formatRefundAmount(track.refund_amount),
        bank_last4: track.bank_last4 ?? undefined,
      });
      if (body) {
        // Schedule for immediate dispatch (cron picks it up within the hour,
        // or you can hit /api/cron/refund-check manually to send right now).
        await supabase.from("scheduled_messages").insert({
          organization_id: profile.organization_id,
          client_id: track.client_id,
          refund_track_id: id,
          channel: "sms",
          template_id: `trigger_${newStatus}`,
          body,
          scheduled_for: new Date().toISOString(),
          status: "pending",
        });
        triggerScheduled = true;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    new_status: newStatus,
    trigger_alert_scheduled: triggerScheduled,
  });
}
