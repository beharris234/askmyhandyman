import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, getUserInfo } from "@/lib/google-oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return redirect("/settings?error=" + encodeURIComponent(errorParam));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  const scope = cookieStore.get("google_oauth_scope")?.value === "personal" ? "personal" : "office";

  if (!code || !state || state !== storedState) {
    return redirect("/settings?error=invalid_state");
  }
  cookieStore.delete("google_oauth_state");
  cookieStore.delete("google_oauth_scope");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) return redirect("/settings?error=no_org");

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfo(tokens.access_token);

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error } = await supabase.from("email_connections").upsert(
      {
        organization_id: profile.organization_id,
        provider: "gmail",
        email_address: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiresAt,
        scopes: tokens.scope.split(" "),
        status: "active",
        preparer_id: scope === "personal" ? user.id : null,
        visibility: scope,
      },
      { onConflict: "organization_id,provider,email_address" }
    );

    if (error) return redirect("/settings?error=" + encodeURIComponent(error.message));
    return redirect("/settings?connected=" + encodeURIComponent(userInfo.email));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return redirect("/settings?error=" + encodeURIComponent(message));
  }
}

function redirect(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL(path, base));
}
