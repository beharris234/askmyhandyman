import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, type EmailConnection } from "@/lib/email-sender";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const emailId = String(form.get("processed_email_id") || "");
  const body = String(form.get("body") || "").trim();
  if (!emailId || !body) {
    return NextResponse.json({ ok: false, error: "processed_email_id and body required" }, { status: 400 });
  }

  const { data: pe } = await supabase
    .from("processed_emails")
    .select("*")
    .eq("id", emailId)
    .single();
  if (!pe || pe.organization_id !== profile.organization_id) {
    return NextResponse.json({ ok: false, error: "email not found" }, { status: 404 });
  }
  if (pe.reply_message_id) {
    return NextResponse.json({ ok: false, error: "already replied to this email" }, { status: 400 });
  }

  const { data: conn } = await supabase
    .from("email_connections")
    .select("*")
    .eq("id", pe.connection_id)
    .single();
  if (!conn) {
    return NextResponse.json({ ok: false, error: "original inbox is no longer connected" }, { status: 400 });
  }

  const subject = (pe.subject || "").startsWith("Re:")
    ? pe.subject || "Re:"
    : `Re: ${pe.subject || ""}`.trim();

  let result;
  try {
    result = await sendEmail(
      conn as EmailConnection,
      {
        toAddress: pe.sender_email,
        subject,
        bodyText: body,
        inReplyToMessageId: pe.provider_message_id,
        providerOriginalMessageId: pe.provider_message_id,
        gmailThreadId: conn.provider === "gmail" ? pe.thread_id : undefined,
      },
      async (newAccess, newRefresh, expiresAt) => {
        const update: { access_token: string; token_expires_at: string; refresh_token?: string } = {
          access_token: newAccess,
          token_expires_at: expiresAt.toISOString(),
        };
        if (newRefresh) update.refresh_token = newRefresh;
        await supabase.from("email_connections").update(update).eq("id", conn.id);
      }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "send failed" },
      { status: 500 }
    );
  }

  // Find or create conversation for this email thread
  let { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .eq("channel", "email")
    .eq("external_address", pe.sender_email)
    .maybeSingle();
  if (!conv) {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        organization_id: profile.organization_id,
        client_id: pe.client_id,
        channel: "email",
        external_address: pe.sender_email,
        display_name: pe.sender_name || pe.sender_email,
      })
      .select()
      .single();
    conv = newConv;
  }

  // Log the sent message
  let sentMessageId: string | null = null;
  if (conv) {
    const { data: m } = await supabase
      .from("messages")
      .insert({
        organization_id: profile.organization_id,
        conversation_id: conv.id,
        client_id: pe.client_id,
        channel: "email",
        direction: "outbound",
        from_address: conn.email_address,
        to_address: pe.sender_email,
        body,
        external_message_id: result.externalMessageId,
        ai_generated: false,
        status: "sent",
        sent_by: user.id,
        metadata: { reply_to_processed_email_id: emailId, thread_id: result.threadId },
      })
      .select()
      .single();
    sentMessageId = m?.id ?? null;
  }

  await supabase
    .from("processed_emails")
    .update({
      reply_message_id: sentMessageId,
      reply_sent_at: new Date().toISOString(),
      status: "replied",
    })
    .eq("id", emailId);

  return NextResponse.json({ ok: true, external_message_id: result.externalMessageId });
}
