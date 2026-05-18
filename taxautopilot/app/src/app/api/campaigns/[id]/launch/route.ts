import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { firstNameOf, generateWinbackMessage } from "@/lib/winback";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organizations(name)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }

  const orgRaw = profile.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { name: string } | null;
  const officeName = org?.name ?? "your tax office";

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign || campaign.organization_id !== profile.organization_id) {
    return NextResponse.json({ ok: false, error: "campaign not found" }, { status: 404 });
  }
  if (campaign.status !== "draft") {
    return NextResponse.json(
      { ok: false, error: `Campaign already ${campaign.status}` },
      { status: 400 }
    );
  }

  // Pull all pending recipients + their client data + computed last year
  const { data: recipients } = await supabase
    .from("campaign_recipients")
    .select("id, client_id, channel, clients(id, full_name, email, phone)")
    .eq("campaign_id", id)
    .eq("status", "pending");

  if (!recipients || recipients.length === 0) {
    return NextResponse.json({ ok: false, error: "no recipients to send to" }, { status: 400 });
  }

  // Compute years lapsed per client from refund_tracks
  const clientIds = Array.from(new Set(recipients.map((r) => r.client_id)));
  const { data: tracks } = await supabase
    .from("refund_tracks")
    .select("client_id, tax_year")
    .in("client_id", clientIds);
  const lastYearByClient = new Map<string, number>();
  for (const t of tracks || []) {
    const y = parseInt(t.tax_year, 10);
    if (Number.isNaN(y)) continue;
    const existing = lastYearByClient.get(t.client_id);
    if (!existing || y > existing) lastYearByClient.set(t.client_id, y);
  }

  const currentYear = new Date().getFullYear();

  await supabase.from("campaigns").update({ status: "sending", launched_at: new Date().toISOString() }).eq("id", id);

  // Generate messages in parallel batches to keep latency down
  const BATCH = 5;
  let queued = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (r) => {
        const clientRaw = r.clients as unknown;
        const client = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as
          | { id: string; full_name: string; email: string | null; phone: string | null }
          | null;
        if (!client) {
          await supabase
            .from("campaign_recipients")
            .update({ status: "skipped", skip_reason: "client_missing" })
            .eq("id", r.id);
          skipped++;
          return;
        }

        // Channel gate
        if (r.channel === "sms" && !client.phone) {
          await supabase
            .from("campaign_recipients")
            .update({ status: "skipped", skip_reason: "no_phone" })
            .eq("id", r.id);
          skipped++;
          return;
        }
        if (r.channel === "email" && !client.email) {
          await supabase
            .from("campaign_recipients")
            .update({ status: "skipped", skip_reason: "no_email" })
            .eq("id", r.id);
          skipped++;
          return;
        }

        const lastYear = lastYearByClient.get(client.id) ?? null;
        const yearsLapsed = lastYear == null ? Infinity : currentYear - lastYear;

        try {
          const msg = await generateWinbackMessage({
            channel: r.channel as "sms" | "email",
            clientFirstName: firstNameOf(client.full_name),
            officeName,
            yearsLapsed,
            lastFiledYear: lastYear,
          });

          // Stamp the rendered message onto the recipient
          await supabase
            .from("campaign_recipients")
            .update({
              rendered_subject: msg.subject || null,
              rendered_body: msg.body,
            })
            .eq("id", r.id);

          // Queue into scheduled_messages — Phase 5 cron sends SMS,
          // email path uses /api/emails/send (queued separately below).
          // For SMS: schedule immediately so cron picks it up next run.
          if (r.channel === "sms") {
            const { data: sched } = await supabase
              .from("scheduled_messages")
              .insert({
                organization_id: profile.organization_id,
                client_id: client.id,
                campaign_recipient_id: r.id,
                channel: "sms",
                template_id: `winback_${campaign.id.slice(0, 8)}`,
                body: msg.body,
                scheduled_for: new Date().toISOString(),
                status: "pending",
              })
              .select()
              .single();
            await supabase
              .from("campaign_recipients")
              .update({ status: "queued", scheduled_message_id: sched?.id ?? null })
              .eq("id", r.id);
          } else {
            // Email: mark as "queued" — manual review/send in UI for now
            // (auto-email send for campaigns lands in Phase 7.6)
            await supabase
              .from("campaign_recipients")
              .update({ status: "queued" })
              .eq("id", r.id);
          }
          queued++;
        } catch (err) {
          await supabase
            .from("campaign_recipients")
            .update({
              status: "failed",
              error_message: err instanceof Error ? err.message : "unknown",
            })
            .eq("id", r.id);
          failed++;
        }
      })
    );
  }

  await supabase
    .from("campaigns")
    .update({ status: queued > 0 ? "sending" : "complete" })
    .eq("id", id);

  return NextResponse.json({ ok: true, queued, skipped, failed });
}
