import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
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
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }
  if (profile.role !== "owner" && profile.role !== "admin") {
    return NextResponse.json({ ok: false, error: "permission_denied" }, { status: 403 });
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
