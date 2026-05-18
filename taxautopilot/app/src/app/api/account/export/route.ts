import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GDPR/CCPA data export. Returns a JSON dump of everything we hold
 * for the requesting user's organization — clients, documents,
 * extractions, conversations, messages, refund tracks, referrals.
 *
 * Streamed as a downloadable JSON file.
 */
export async function GET() {
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

  const orgId = profile.organization_id;

  const [
    organization,
    members,
    clients,
    documents,
    extractions,
    conversations,
    messages,
    refundTracks,
    processedEmails,
    referrals,
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).single().then((r) => r.data),
    supabase.from("profiles").select("id, full_name, email, role, created_at").eq("organization_id", orgId).then((r) => r.data),
    supabase.from("clients").select("*").eq("organization_id", orgId).then((r) => r.data),
    supabase.from("documents").select("*").eq("organization_id", orgId).then((r) => r.data),
    supabase.from("extractions").select("*").eq("organization_id", orgId).then((r) => r.data),
    supabase.from("conversations").select("*").eq("organization_id", orgId).then((r) => r.data),
    supabase.from("messages").select("*").eq("organization_id", orgId).then((r) => r.data),
    supabase.from("refund_tracks").select("*").eq("organization_id", orgId).then((r) => r.data),
    supabase.from("processed_emails").select("*").eq("organization_id", orgId).then((r) => r.data),
    supabase.from("referrals").select("*").or(`referrer_org_id.eq.${orgId},referee_org_id.eq.${orgId}`).then((r) => r.data),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    exported_by: user.email,
    organization,
    members,
    clients,
    documents,
    extractions,
    conversations,
    messages,
    refund_tracks: refundTracks,
    processed_emails: processedEmails,
    referrals,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="taxautopilot-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
