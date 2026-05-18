import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";
import { testImapConnection } from "@/lib/imap";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }

  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
    return NextResponse.json(
      { ok: false, error: "Server missing ENCRYPTION_KEY (32+ chars). Set it in .env.local." },
      { status: 500 }
    );
  }

  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const host = String(form.get("host") || "").trim();
  const port = parseInt(String(form.get("port") || "993"), 10);
  const secure = String(form.get("secure") || "true") === "true";

  if (!email || !password || !host || !port) {
    return NextResponse.json({ ok: false, error: "All fields are required." }, { status: 400 });
  }

  // Test the connection before saving
  const test = await testImapConnection({ host, port, secure, email, password });
  if (!test.ok) {
    return NextResponse.json(
      { ok: false, error: `Couldn't connect: ${test.error}` },
      { status: 400 }
    );
  }

  const encryptedPassword = encrypt(password);

  const { error } = await supabase.from("email_connections").upsert(
    {
      organization_id: profile.organization_id,
      provider: "imap",
      email_address: email,
      access_token: "imap",
      refresh_token: "imap",
      imap_host: host,
      imap_port: port,
      imap_secure: secure,
      imap_password_encrypted: encryptedPassword,
      status: "active",
    },
    { onConflict: "organization_id,provider,email_address" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
