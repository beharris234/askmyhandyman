import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Permanently deletes the current user's account. The org is preserved if
 * other members exist — only the user's profile + auth record are removed.
 * If they're the last/only member, the whole org cascades-deletes via FKs.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to call admin.deleteUser.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error: "Server missing SUPABASE_SERVICE_ROLE_KEY — required to delete auth users. Set it in .env.local.",
      },
      { status: 500 }
    );
  }

  // Use admin client for the actual delete (auth users can't delete themselves)
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );

  // Check if this user is the only owner of an org — if so, delete the org too
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.organization_id && profile.role === "owner") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .neq("id", user.id);
    if ((count ?? 0) === 0) {
      // Only owner — delete the whole org (cascades to clients, docs, etc.)
      await admin.from("organizations").delete().eq("id", profile.organization_id);
    }
  }

  // Delete the auth user (cascades profile via FK)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Sign out the now-orphan session
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
