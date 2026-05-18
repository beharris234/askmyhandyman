import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getMicrosoftAuthUrl } from "@/lib/microsoft-oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", appUrl()));

  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return new Response(
      "Microsoft OAuth not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env.local. See README.",
      { status: 500 }
    );
  }

  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("ms_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "personal" ? "personal" : "office";
  cookieStore.set("ms_oauth_scope", scope, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getMicrosoftAuthUrl(state));
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
