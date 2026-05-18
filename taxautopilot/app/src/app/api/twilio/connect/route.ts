import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";
import { testTwilioCredentials, normalizePhone } from "@/lib/twilio";

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
  const accountSid = String(form.get("account_sid") || "").trim();
  const authToken = String(form.get("auth_token") || "").trim();
  const phoneRaw = String(form.get("phone_number") || "").trim();
  const phoneNumber = normalizePhone(phoneRaw);
  const scope = String(form.get("scope") || "office") === "personal" ? "personal" : "office";

  if (!accountSid || !authToken || !phoneNumber) {
    return NextResponse.json(
      { ok: false, error: "All fields required. Phone must be valid US number." },
      { status: 400 }
    );
  }

  if (!accountSid.startsWith("AC")) {
    return NextResponse.json(
      { ok: false, error: "Account SID should start with AC..." },
      { status: 400 }
    );
  }

  const test = await testTwilioCredentials({ accountSid, authToken, phoneNumber });
  if (!test.ok) {
    return NextResponse.json({ ok: false, error: test.error }, { status: 400 });
  }

  const { error } = await supabase.from("twilio_numbers").upsert(
    {
      organization_id: profile.organization_id,
      account_sid: accountSid,
      auth_token_encrypted: encrypt(authToken),
      phone_number: phoneNumber,
      friendly_name: test.friendlyName || null,
      webhook_secret: randomBytes(16).toString("base64url"),
      preparer_id: scope === "personal" ? user.id : null,
      visibility: scope,
      status: "active",
    },
    { onConflict: "organization_id,phone_number" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
