import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }

  const form = await request.formData();
  const assignedTo = String(form.get("preparer_id") || "") || null;

  // If reassigning to a different preparer, require owner/admin.
  // Preparers can only assign to themselves (claim) or unassign their own.
  if (assignedTo && assignedTo !== user.id && profile.role === "preparer") {
    return NextResponse.json(
      { ok: false, error: "Only owners and admins can assign clients to other preparers." },
      { status: 403 }
    );
  }

  // Verify the target preparer belongs to the same org
  if (assignedTo) {
    const { data: target } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedTo)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();
    if (!target) {
      return NextResponse.json({ ok: false, error: "preparer_not_in_org" }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("clients")
    .update({ assigned_preparer_id: assignedTo })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
