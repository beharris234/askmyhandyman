import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMoneyReport } from "@/lib/money-report";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }

  // Pre-load counts for the report header
  const [clientCount, docCount, emailCount] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("organization_id", profile.organization_id),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("organization_id", profile.organization_id),
    supabase.from("processed_emails").select("*", { count: "exact", head: true }).eq("organization_id", profile.organization_id),
  ]);

  // Insert pending report row
  const { data: report, error: insertErr } = await supabase
    .from("money_reports")
    .insert({
      organization_id: profile.organization_id,
      generated_by: user.id,
      status: "generating",
      client_count: clientCount.count ?? 0,
      documents_count: docCount.count ?? 0,
      emails_count: emailCount.count ?? 0,
    })
    .select()
    .single();

  if (insertErr || !report) {
    return NextResponse.json(
      { ok: false, error: insertErr?.message ?? "failed to create report" },
      { status: 500 }
    );
  }

  // Run the analysis (this is the expensive part — ~5-10s)
  try {
    const { findings, total, ai_summary } = await runMoneyReport(supabase, profile.organization_id);

    await supabase
      .from("money_reports")
      .update({
        status: "complete",
        findings,
        total_opportunity: total,
        ai_summary,
        completed_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    return NextResponse.json({ ok: true, report_id: report.id });
  } catch (err) {
    await supabase
      .from("money_reports")
      .update({ status: "failed" })
      .eq("id", report.id);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "analysis failed" },
      { status: 500 }
    );
  }
}
