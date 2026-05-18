import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildInviteUrl, generateInviteToken } from "@/lib/invitations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }
  if (profile.role !== "owner" && profile.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only owners and admins can invite." }, { status: 403 });
  }

  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const role = String(form.get("role") || "preparer");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Valid email required." }, { status: 400 });
  }
  if (!["owner", "admin", "preparer"].includes(role)) {
    return NextResponse.json({ ok: false, error: "Invalid role." }, { status: 400 });
  }

  // Revoke any prior pending invite to the same email + org
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("organization_id", profile.organization_id)
    .eq("email", email)
    .eq("status", "pending");

  const token = generateInviteToken();
  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({
      organization_id: profile.organization_id,
      email,
      role,
      token,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    ok: true,
    invite_id: invite.id,
    invite_url: buildInviteUrl(token, appUrl),
  });
}
