import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { filterAudience, type AudienceCriteria, type Channel, type ClientForAudience } from "@/lib/winback";

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
  const channel = (String(form.get("channel") || "sms") as Channel);
  const criteria: AudienceCriteria = {
    lapsed_years_min: parseInt(String(form.get("lapsed_years_min") || "1"), 10),
    require_phone: String(form.get("require_phone") || "true") === "true",
    require_email: String(form.get("require_email") || "true") === "true",
    include_archived: String(form.get("include_archived") || "false") === "true",
  };

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, status, last_filed_year")
    .eq("organization_id", profile.organization_id);

  // Pull max tax_year per client from refund_tracks
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

  return NextResponse.json({
    ok: true,
    count: audience.length,
    sample: audience.slice(0, 10).map((c) => ({
      id: c.id,
      full_name: c.full_name,
      years_lapsed: c.years_lapsed === Infinity ? null : c.years_lapsed,
      last_year: c.computed_last_year,
      has_phone: !!c.phone,
      has_email: !!c.email,
    })),
  });
}
