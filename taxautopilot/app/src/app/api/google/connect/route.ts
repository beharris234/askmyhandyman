import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getGoogleAuthUrl } from "@/lib/google-oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", appUrl()));

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return new Response(
      "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local. See README.",
      { status: 500 }
    );
  }

  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // Capture connection scope (personal vs office) from query param so we
  // can apply it in the callback. Defaults to office-wide.
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "personal" ? "personal" : "office";
  cookieStore.set("google_oauth_scope", scope, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getGoogleAuthUrl(state));
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
