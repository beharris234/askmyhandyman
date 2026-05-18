import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { draftEmailReply } from "@/lib/email-drafter";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, organization_id, organizations(name)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }

  const form = await request.formData();
  const emailId = String(form.get("processed_email_id") || "");
  if (!emailId) {
    return NextResponse.json({ ok: false, error: "processed_email_id required" }, { status: 400 });
  }

  const { data: pe } = await supabase
    .from("processed_emails")
    .select("*, clients(full_name)")
    .eq("id", emailId)
    .single();
  if (!pe || pe.organization_id !== profile.organization_id) {
    return NextResponse.json({ ok: false, error: "email not found" }, { status: 404 });
  }

  const clientRaw = pe.clients as unknown;
  const client = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as
    | { full_name: string }
    | null;
  const orgRaw = profile.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { name?: string } | null;
  const orgName = org?.name ?? "your tax office";

  try {
    const drafted = await draftEmailReply({
      clientName: client?.full_name ?? null,
      preparerName: profile.full_name || "the team",
      officeName: orgName,
      incomingFrom: pe.sender_email || "(unknown)",
      incomingSubject: pe.subject || "(no subject)",
      incomingBody: pe.snippet || "",
      classification: pe.ai_classification || "other",
    });

    await supabase
      .from("processed_emails")
      .update({
        reply_draft: drafted.reply,
        reply_draft_confidence: drafted.confidence,
        reply_draft_needs_human: drafted.needs_human,
      })
      .eq("id", emailId);

    return NextResponse.json({ ok: true, draft: drafted });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "draft failed" },
      { status: 500 }
    );
  }
}
