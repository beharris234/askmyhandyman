import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { decrypt } from "@/lib/encryption";
import { validateTwilioSignature, normalizePhone } from "@/lib/twilio";
import { draftReply } from "@/lib/message-drafter";

export const runtime = "nodejs";

/**
 * Twilio POSTs application/x-www-form-urlencoded payloads here when
 * a text comes in to one of our org phone numbers. We:
 *   1. Validate the X-Twilio-Signature
 *   2. Match the office by their Twilio "To" number
 *   3. Match (or create) the client by sender phone
 *   4. Save the inbound message
 *   5. Draft an AI reply (saved as 'draft' for the tax pro to approve)
 */
export async function POST(request: NextRequest) {
  // Twilio sends form-encoded data
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of formData.entries()) params[k] = String(v);

  const fromPhone = normalizePhone(params.From);
  const toPhone = normalizePhone(params.To);
  const body = params.Body || "";
  const messageSid = params.MessageSid;

  if (!fromPhone || !toPhone || !messageSid) {
    return twiml(); // Acknowledge silently — Twilio retries on 5xx
  }

  // Use service-role-style admin client since Twilio is unauthenticated
  // (we authorize via the signature instead)
  const supabase = createServiceClient();

  // Find the org by Twilio number
  const { data: twilioNum } = await supabase
    .from("twilio_numbers")
    .select("id, organization_id, auth_token_encrypted")
    .eq("phone_number", toPhone)
    .eq("status", "active")
    .maybeSingle();

  if (!twilioNum) return twiml();

  // Validate signature
  const authToken = decrypt(twilioNum.auth_token_encrypted);
  const signature = request.headers.get("x-twilio-signature");
  const protoHeader = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || request.nextUrl.host;
  const fullUrl = `${protoHeader}://${host}${request.nextUrl.pathname}`;

  const valid = validateTwilioSignature(authToken, fullUrl, params, signature);
  if (!valid && process.env.NODE_ENV === "production") {
    return new Response("Invalid signature", { status: 403 });
  }

  // Skip duplicate webhook deliveries
  const { data: existing } = await supabase
    .from("messages")
    .select("id")
    .eq("external_message_id", messageSid)
    .maybeSingle();
  if (existing) return twiml();

  // Match client by phone
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("organization_id", twilioNum.organization_id)
    .eq("phone", fromPhone)
    .maybeSingle();

  // Find or create conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", twilioNum.organization_id)
    .eq("channel", "sms")
    .eq("external_address", fromPhone)
    .maybeSingle();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        organization_id: twilioNum.organization_id,
        client_id: client?.id ?? null,
        channel: "sms",
        external_address: fromPhone,
        display_name: client?.full_name ?? fromPhone,
      })
      .select()
      .single();
    conversation = newConv;
  }
  if (!conversation) return twiml();

  // Save inbound message
  await supabase.from("messages").insert({
    organization_id: twilioNum.organization_id,
    conversation_id: conversation.id,
    client_id: client?.id ?? null,
    channel: "sms",
    direction: "inbound",
    external_message_id: messageSid,
    from_address: fromPhone,
    to_address: toPhone,
    body,
    status: "received",
  });

  // Pull last 6 messages for AI context
  const { data: history } = await supabase
    .from("messages")
    .select("direction, body, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(20);

  // Get office name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", twilioNum.organization_id)
    .single();

  // Draft an AI reply (always saved as draft for now — auto-send is Phase 4.5)
  try {
    const drafted = await draftReply({
      channel: "sms",
      clientName: client?.full_name ?? null,
      officeName: org?.name ?? "your tax office",
      conversationHistory: (history || []).map((m) => ({
        direction: m.direction as "inbound" | "outbound",
        body: m.body,
        created_at: m.created_at,
      })),
      incomingMessage: body,
    });

    await supabase.from("messages").insert({
      organization_id: twilioNum.organization_id,
      conversation_id: conversation.id,
      client_id: client?.id ?? null,
      channel: "sms",
      direction: "outbound",
      from_address: toPhone,
      to_address: fromPhone,
      body: drafted.reply,
      ai_generated: true,
      ai_confidence: drafted.confidence,
      status: "draft",
      metadata: { reasoning: drafted.reasoning, needs_human: drafted.needs_human },
    });
  } catch (err) {
    console.error("[sms-incoming] AI draft failed:", err);
  }

  return twiml();
}

function twiml() {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { "content-type": "text/xml" },
  });
}

function createServiceClient() {
  // For webhooks, we can't use cookies. Use service role if available,
  // fall back to anon key (RLS will block writes — only works with service role).
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
