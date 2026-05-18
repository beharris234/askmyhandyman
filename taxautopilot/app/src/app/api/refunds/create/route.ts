import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildSchedule,
  computeExpectedDates,
  firstName,
  formatRefundAmount,
} from "@/lib/refund-tracker";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
  const clientId = String(form.get("client_id") || "");
  const taxYear = String(form.get("tax_year") || "").trim();
  const filedDateStr = String(form.get("filed_date") || "");
  const refundAmount = String(form.get("refund_amount") || "").trim() || null;
  const amountOwed = String(form.get("amount_owed") || "").trim() || null;
  const filingStatus = String(form.get("filing_status") || "").trim() || null;
  const refundMethod = (String(form.get("refund_method") || "direct_deposit") as "direct_deposit" | "check");
  const bankLast4 = String(form.get("bank_last4") || "").trim().slice(0, 4) || null;

  if (!clientId || !taxYear || !filedDateStr) {
    return NextResponse.json(
      { ok: false, error: "client_id, tax_year, and filed_date are required" },
      { status: 400 }
    );
  }

  const filedDate = new Date(filedDateStr + "T00:00:00");
  if (Number.isNaN(filedDate.getTime())) {
    return NextResponse.json({ ok: false, error: "filed_date is invalid" }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, organization_id")
    .eq("id", clientId)
    .single();
  if (!client || client.organization_id !== profile.organization_id) {
    return NextResponse.json({ ok: false, error: "client not found" }, { status: 404 });
  }

  const { expectedAcceptance, expectedRefund } = computeExpectedDates({
    filedDate,
    refundMethod,
  });

  const { data: track, error: trackErr } = await supabase
    .from("refund_tracks")
    .insert({
      organization_id: profile.organization_id,
      client_id: clientId,
      tax_year: taxYear,
      filed_date: filedDateStr,
      refund_amount: refundAmount,
      amount_owed: amountOwed,
      filing_status: filingStatus,
      refund_method: refundMethod,
      bank_last4: bankLast4,
      expected_acceptance_date: expectedAcceptance.toISOString().slice(0, 10),
      expected_refund_date: expectedRefund.toISOString().slice(0, 10),
      current_status: "filed",
    })
    .select()
    .single();

  if (trackErr || !track) {
    return NextResponse.json(
      { ok: false, error: trackErr?.message ?? "failed to create track" },
      { status: 500 }
    );
  }

  const orgName = (profile.organizations as { name?: string } | null)?.name ?? "your tax office";
  const vars = {
    first_name: firstName(client.full_name),
    office_name: orgName,
    tax_year: taxYear,
    refund_amount: formatRefundAmount(refundAmount),
    bank_last4: bankLast4 ?? undefined,
  };

  const schedule = buildSchedule(filedDate, vars);
  if (schedule.length > 0) {
    await supabase.from("scheduled_messages").insert(
      schedule.map((s) => ({
        organization_id: profile.organization_id,
        client_id: clientId,
        refund_track_id: track.id,
        channel: "sms",
        template_id: s.template_id,
        body: s.body,
        scheduled_for: s.scheduled_for.toISOString(),
        status: "pending",
      }))
    );
  }

  return NextResponse.json({
    ok: true,
    track_id: track.id,
    scheduled_count: schedule.length,
  });
}
