import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  filterAudience,
  type AudienceCriteria,
  type Channel,
  type ClientForAudience,
} from "@/lib/winback";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const channel = (String(form.get("channel") || "sms") as Channel);
  const type = String(form.get("type") || "winback");

  const criteria: AudienceCriteria = {
    lapsed_years_min: parseInt(String(form.get("lapsed_years_min") || "1"), 10),
    require_phone: String(form.get("require_phone") || "true") === "true",
    require_email: String(form.get("require_email") || "true") === "true",
    include_archived: String(form.get("include_archived") || "false") === "true",
  };

  if (!name) {
    return NextResponse.json({ ok: false, error: "Campaign name required." }, { status: 400 });
  }

  // Compute the audience right now so we can store the count
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, status, last_filed_year")
    .eq("organization_id", profile.organization_id);

  const { data: tracks } = await supabase
    .from("refund_tracks")
    .select("client_id, tax_year")
    .eq("organization_id", profile.organization_id);

  const lastYearByClient = new Map<string, number>();
  for (const t of tracks || []) {
    const y = parseInt(t.tax_year, 10);
    if (Number.isNaN(y)) continue;
    const existing = lastYearByClient.get(t.client_id);
    if (!existing || y > existing) lastYearByClient.set(t.client_id, y);
  }

  const audience = filterAudience(
    (clients || []) as ClientForAudience[],
    lastYearByClient,
    criteria,
    channel
  );

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      organization_id: profile.organization_id,
      created_by: user.id,
      name,
      type,
      channel,
      audience_criteria: criteria,
      audience_count: audience.length,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Pre-create recipient rows (status=pending). Actual messages are
  // generated and queued at launch time so the user can review first.
  if (audience.length > 0) {
    const channelsToSend: Array<"sms" | "email"> =
      channel === "both" ? ["sms", "email"] : [channel as "sms" | "email"];
    const rows = audience.flatMap((c) =>
      channelsToSend.map((ch) => ({
        campaign_id: campaign.id,
        organization_id: profile.organization_id,
        client_id: c.id,
        channel: ch,
        status: "pending",
      }))
    );
    await supabase.from("campaign_recipients").insert(rows);
  }

  return NextResponse.json({ ok: true, campaign_id: campaign.id, audience_count: audience.length });
}
