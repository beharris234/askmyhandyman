import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const form = await request.formData();
  const token = String(form.get("token") || "");
  if (!token) return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });

  const { data: invite } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (!invite) return NextResponse.json({ ok: false, error: "invite_not_found" }, { status: 404 });
  if (invite.status !== "pending") {
    return NextResponse.json({ ok: false, error: `invite_${invite.status}` }, { status: 400 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    await supabase.from("invitations").update({ status: "expired" }).eq("id", invite.id);
    return NextResponse.json({ ok: false, error: "invite_expired" }, { status: 400 });
  }

  // Update the user's profile to join this org with the assigned role
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      organization_id: invite.organization_id,
      role: invite.role,
    })
    .eq("id", user.id);

  if (profileErr) {
    return NextResponse.json({ ok: false, error: profileErr.message }, { status: 500 });
  }

  // Mark invitation accepted
  await supabase
    .from("invitations")
    .update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true, organization_id: invite.organization_id });
}
