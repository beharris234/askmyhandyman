import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { decrypt } from "@/lib/encryption";
import { sendSms, normalizePhone } from "@/lib/twilio";
import { shouldSkipForStatus } from "@/lib/refund-tracker";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Daily cron handler. Wired in vercel.json to run at 14:00 UTC
 * (9-10am US Eastern). Sends every scheduled message whose
 * scheduled_for is in the past, respecting per-track status to
 * skip messages that no longer make sense.
 *
 * Auth: Vercel sends Authorization: Bearer <CRON_SECRET>.
 * In dev you can hit this manually with that header set.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceClient();

  // Pull all pending messages whose scheduled_for is in the past
  const { data: due, error } = await supabase
    .from("scheduled_messages")
    .select(`
      id, organization_id, client_id, refund_track_id, channel,
      template_id, body, scheduled_for,
      clients(full_name, phone),
      refund_tracks(current_status, alerts_enabled)
    `)
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!due || due.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, sent: 0, skipped: 0, failed: 0 });
  }

  // Pre-load active Twilio numbers per org
  type TwilioRow = {
    organization_id: string;
    account_sid: string;
    auth_token_encrypted: string;
    phone_number: string;
  };
  const orgIds = Array.from(new Set(due.map((d) => d.organization_id)));
  const { data: twilioRows } = await supabase
    .from("twilio_numbers")
    .select("organization_id, account_sid, auth_token_encrypted, phone_number")
    .eq("status", "active")
    .in("organization_id", orgIds);
  const twilioByOrg = new Map<string, TwilioRow>();
  for (const row of (twilioRows || []) as TwilioRow[]) twilioByOrg.set(row.organization_id, row);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const msg of due) {
    const client = pickOne<{ full_name: string; phone: string | null }>(msg.clients);
    const track = pickOne<{ current_status: string; alerts_enabled: boolean }>(msg.refund_tracks);

    // Track was deleted or alerts disabled
    if (msg.refund_track_id && (!track || !track.alerts_enabled)) {
      await markSkipped(supabase, msg.id, "alerts_disabled_or_track_missing");
      skipped++;
      continue;
    }

    // Status has progressed past the point where this template applies
    if (track && shouldSkipForStatus(msg.template_id, track.current_status)) {
      await markSkipped(supabase, msg.id, `status_${track.current_status}_past_template`);
      skipped++;
      continue;
    }

    const toPhone = normalizePhone(client?.phone);
    if (!toPhone) {
      await markSkipped(supabase, msg.id, "client_missing_phone");
      skipped++;
      continue;
    }

    const twilio = twilioByOrg.get(msg.organization_id);
    if (!twilio) {
      await markSkipped(supabase, msg.id, "no_active_twilio_number");
      skipped++;
      continue;
    }

    try {
      const result = await sendSms(
        {
          accountSid: twilio.account_sid,
          authToken: decrypt(twilio.auth_token_encrypted),
          phoneNumber: twilio.phone_number,
        },
        toPhone,
        msg.body
      );

      // Find or create the conversation, then log the message
      let { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("organization_id", msg.organization_id)
        .eq("channel", "sms")
        .eq("external_address", toPhone)
        .maybeSingle();
      if (!conv) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            organization_id: msg.organization_id,
            client_id: msg.client_id,
            channel: "sms",
            external_address: toPhone,
            display_name: client?.full_name ?? toPhone,
          })
          .select()
          .single();
        conv = newConv;
      }

      let sentMessageId: string | null = null;
      if (conv) {
        const { data: insertedMessage } = await supabase
          .from("messages")
          .insert({
            organization_id: msg.organization_id,
            conversation_id: conv.id,
            client_id: msg.client_id,
            channel: "sms",
            direction: "outbound",
            from_address: twilio.phone_number,
            to_address: toPhone,
            body: msg.body,
            external_message_id: result.sid,
            ai_generated: true,
            status: "sent",
            metadata: { source: "refund_cron", template_id: msg.template_id },
          })
          .select()
          .single();
        sentMessageId = insertedMessage?.id ?? null;
      }

      await supabase
        .from("scheduled_messages")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          sent_message_id: sentMessageId,
        })
        .eq("id", msg.id);

      sent++;
    } catch (err) {
      await supabase
        .from("scheduled_messages")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "unknown error",
        })
        .eq("id", msg.id);
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: due.length,
    sent,
    skipped,
    failed,
  });
}

type SbAdmin = ReturnType<typeof createServiceClient>;

async function markSkipped(supabase: SbAdmin, id: string, reason: string) {
  await supabase
    .from("scheduled_messages")
    .update({ status: "skipped", skip_reason: reason })
    .eq("id", id);
}

function pickOne<T>(v: unknown): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return (v[0] as T) ?? null;
  return v as T;
}

function createServiceClient() {
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
