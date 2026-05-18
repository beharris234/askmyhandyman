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
  const fullName = String(form.get("full_name") || "").trim() || null;
  const newEmail = String(form.get("email") || "").trim() || null;
  const newPassword = String(form.get("password") || "");

  const updates: { full_name?: string } = {};
  if (fullName) updates.full_name = fullName;
  if (Object.keys(updates).length > 0) {
    const { error: profileErr } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (profileErr) return NextResponse.json({ ok: false, error: profileErr.message }, { status: 500 });
  }

  // Email and password go through auth.updateUser
  const authUpdate: { email?: string; password?: string } = {};
  if (newEmail && newEmail !== user.email) authUpdate.email = newEmail;
  if (newPassword && newPassword.length >= 8) authUpdate.password = newPassword;

  if (Object.keys(authUpdate).length > 0) {
    const { error: authErr } = await supabase.auth.updateUser(authUpdate);
    if (authErr) return NextResponse.json({ ok: false, error: authErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email_change_pending: !!authUpdate.email,
  });
}
