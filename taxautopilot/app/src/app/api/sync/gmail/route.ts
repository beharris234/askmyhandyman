import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  GmailClient,
  getAttachments,
  getBodyText,
  getHeader,
  parseSender,
} from "@/lib/gmail";
import { classifyEmail } from "@/lib/email-classifier";
import { extractDocument } from "@/lib/extraction";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_MESSAGES_PER_RUN = 25;

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

  const url = request.nextUrl;
  const connectionId = url.searchParams.get("connection_id");

  let q = supabase
    .from("email_connections")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("provider", "gmail")
    .eq("status", "active");
  if (connectionId) q = q.eq("id", connectionId);

  const { data: connections, error: connErr } = await q;
  if (connErr || !connections?.length) {
    return NextResponse.json({ ok: false, error: "no_active_connections" }, { status: 400 });
  }

  const results = [];
  for (const conn of connections) {
    try {
      const r = await syncConnection(supabase, conn);
      results.push({ connection_id: conn.id, ...r });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      await supabase
        .from("email_connections")
        .update({ status: "error" })
        .eq("id", conn.id);
      results.push({ connection_id: conn.id, ok: false, error: message });
    }
  }

  return NextResponse.json({ ok: true, results });
}

type SbClient = Awaited<ReturnType<typeof createClient>>;

async function syncConnection(supabase: SbClient, conn: {
  id: string;
  organization_id: string;
  access_token: string;
  refresh_token: string;
  email_address: string;
  last_synced_at: string | null;
}) {
  const gmail = new GmailClient(
    conn.access_token,
    conn.refresh_token,
    async (newAccess, expiresAt) => {
      await supabase
        .from("email_connections")
        .update({
          access_token: newAccess,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", conn.id);
    }
  );

  // Build query: messages after last sync, in inbox, not from self
  const sinceUnix = conn.last_synced_at
    ? Math.floor(new Date(conn.last_synced_at).getTime() / 1000)
    : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const query = `in:inbox after:${sinceUnix} -from:${conn.email_address}`;

  const list = await gmail.listMessages({ query, maxResults: MAX_MESSAGES_PER_RUN });

  let processed = 0;
  let skipped = 0;
  let documentsExtracted = 0;
  const errors: string[] = [];

  // Pre-load clients for this org so we can match senders
  const { data: clients } = await supabase
    .from("clients")
    .select("id, email")
    .eq("organization_id", conn.organization_id)
    .not("email", "is", null);
  const clientByEmail = new Map<string, string>();
  for (const c of clients || []) {
    if (c.email) clientByEmail.set(c.email.toLowerCase(), c.id);
  }

  for (const ref of list.messages) {
    // Skip if already processed
    const { data: existing } = await supabase
      .from("processed_emails")
      .select("id")
      .eq("connection_id", conn.id)
      .eq("provider_message_id", ref.id)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    try {
      const msg = await gmail.getMessage(ref.id);
      const fromHeader = getHeader(msg, "from");
      const sender = parseSender(fromHeader);
      const subject = getHeader(msg, "subject") || "(no subject)";
      const dateHeader = getHeader(msg, "date");
      const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
      const body = getBodyText(msg);
      const attachments = getAttachments(msg);
      const matchedClientId = sender.email ? clientByEmail.get(sender.email.toLowerCase()) : undefined;

      const classification = await classifyEmail({
        subject,
        snippet: msg.snippet || "",
        body,
        hasAttachments: attachments.length > 0,
        senderEmail: sender.email,
      });

      // Save processed email record
      const { data: pe, error: peErr } = await supabase
        .from("processed_emails")
        .insert({
          organization_id: conn.organization_id,
          connection_id: conn.id,
          client_id: matchedClientId || null,
          provider_message_id: ref.id,
          thread_id: ref.threadId,
          sender_email: sender.email || null,
          sender_name: sender.name || null,
          subject,
          snippet: msg.snippet || null,
          received_at: receivedAt,
          has_attachments: attachments.length > 0,
          attachment_count: attachments.length,
          ai_classification: classification.classification,
          ai_summary: classification.summary,
          ai_suggested_action: classification.suggested_action,
          status: matchedClientId ? "processed" : "needs_action",
        })
        .select()
        .single();
      if (peErr) {
        errors.push(`save email ${ref.id}: ${peErr.message}`);
        continue;
      }

      // Run extraction on each extractable attachment
      let extractedHere = 0;
      for (const att of attachments) {
        if (!att.mimeType.startsWith("image/")) continue; // PDFs deferred
        try {
          const buffer = await gmail.getAttachment(ref.id, att.attachmentId);
          const base64 = buffer.toString("base64");
          const result = await extractDocument(
            base64,
            att.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
          );

          const { data: doc } = await supabase
            .from("documents")
            .insert({
              organization_id: conn.organization_id,
              client_id: matchedClientId || null,
              file_name: att.filename,
              mime_type: att.mimeType,
              size_bytes: att.size,
              document_type: result.data.document_type,
              tax_year: result.data.tax_year || null,
              extraction_status: "complete",
            })
            .select()
            .single();

          if (doc) {
            await supabase.from("extractions").insert({
              organization_id: conn.organization_id,
              document_id: doc.id,
              result: result.data,
              confidence: result.data.confidence,
              warnings: result.data.warnings,
              elapsed_ms: result.elapsed_ms,
              tokens_input: result.input_tokens,
              tokens_output: result.output_tokens,
            });
            extractedHere++;
            documentsExtracted++;
          }
        } catch (err) {
          errors.push(`extract ${att.filename}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }

      if (extractedHere > 0 && pe) {
        await supabase
          .from("processed_emails")
          .update({ documents_created: extractedHere })
          .eq("id", pe.id);
      }

      processed++;
    } catch (err) {
      errors.push(`message ${ref.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  await supabase
    .from("email_connections")
    .update({ last_synced_at: new Date().toISOString(), status: "active" })
    .eq("id", conn.id);

  return { ok: true, processed, skipped, documents_extracted: documentsExtracted, errors };
}
