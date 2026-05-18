import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { sendSms } from "@/lib/twilio";

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

  const form = await request.formData();
  const conversationId = String(form.get("conversation_id") || "");
  const body = String(form.get("body") || "").trim();
  const draftMessageId = String(form.get("draft_id") || "") || null;

  if (!conversationId || !body) {
    return NextResponse.json(
      { ok: false, error: "conversation_id and body required" },
      { status: 400 }
    );
  }

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, channel, external_address, client_id")
    .eq("id", conversationId)
    .single();
  if (!conv) return NextResponse.json({ ok: false, error: "conversation not found" }, { status: 404 });

  if (conv.channel !== "sms") {
    return NextResponse.json(
      { ok: false, error: "Only SMS sending is wired up in Phase 4. Email reply coming in 4.5." },
      { status: 400 }
    );
  }

  const { data: twilioNum } = await supabase
    .from("twilio_numbers")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("status", "active")
    .maybeSingle();

  if (!twilioNum) {
    return NextResponse.json(
      { ok: false, error: "No active Twilio number. Connect one in Settings." },
      { status: 400 }
    );
  }

  let externalId: string | null = null;
  try {
    const result = await sendSms(
      {
        accountSid: twilioNum.account_sid,
        authToken: decrypt(twilioNum.auth_token_encrypted),
        phoneNumber: twilioNum.phone_number,
      },
      conv.external_address,
      body
    );
    externalId = result.sid;
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  // If we sent a previously-drafted message, update it; otherwise insert new
  if (draftMessageId) {
    await supabase
      .from("messages")
      .update({
        body,
        status: "sent",
        external_message_id: externalId,
        sent_by: user.id,
      })
      .eq("id", draftMessageId)
      .eq("conversation_id", conversationId);
  } else {
    await supabase.from("messages").insert({
      organization_id: profile.organization_id,
      conversation_id: conversationId,
      client_id: conv.client_id,
      channel: "sms",
      direction: "outbound",
      from_address: twilioNum.phone_number,
      to_address: conv.external_address,
      body,
      external_message_id: externalId,
      status: "sent",
      sent_by: user.id,
    });
  }

  // Clear unread count on this conversation
  await supabase
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", conversationId);

  return NextResponse.json({ ok: true, external_message_id: externalId });
}
