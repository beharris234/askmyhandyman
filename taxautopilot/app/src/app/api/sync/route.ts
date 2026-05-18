import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  GmailClient,
  getAttachments as getGmailAttachments,
  getBodyText as getGmailBody,
  getHeader,
  parseSender,
} from "@/lib/gmail";
import { OutlookClient, stripHtml } from "@/lib/outlook";
import { fetchRecentImapMessages } from "@/lib/imap";
import { decrypt } from "@/lib/encryption";
import { classifyEmail } from "@/lib/email-classifier";
import { extractDocument } from "@/lib/extraction";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PER_RUN = 25;

type SbClient = Awaited<ReturnType<typeof createClient>>;

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
    .eq("status", "active");
  if (connectionId) q = q.eq("id", connectionId);

  const { data: connections } = await q;
  if (!connections?.length) {
    return NextResponse.json({ ok: false, error: "no_active_connections" }, { status: 400 });
  }

  // Pre-load clients for sender matching
  const { data: clientsList } = await supabase
    .from("clients")
    .select("id, email")
    .eq("organization_id", profile.organization_id)
    .not("email", "is", null);
  const clientByEmail = new Map<string, string>();
  for (const c of clientsList || []) {
    if (c.email) clientByEmail.set(c.email.toLowerCase(), c.id);
  }

  const results = [];
  for (const conn of connections) {
    try {
      let r;
      if (conn.provider === "gmail") r = await syncGmail(supabase, conn, clientByEmail);
      else if (conn.provider === "outlook") r = await syncOutlook(supabase, conn, clientByEmail);
      else if (conn.provider === "imap") r = await syncImap(supabase, conn, clientByEmail);
      else r = { ok: false, error: `unknown provider: ${conn.provider}` };
      results.push({ connection_id: conn.id, provider: conn.provider, ...r });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      await supabase
        .from("email_connections")
        .update({ status: "error" })
        .eq("id", conn.id);
      results.push({ connection_id: conn.id, provider: conn.provider, ok: false, error: message });
    }
  }

  return NextResponse.json({ ok: true, results });
}

// ============================================================
// PROVIDER-SPECIFIC SYNC FUNCTIONS
// All three converge into processEmail() which does the AI +
// extraction + persistence work.
// ============================================================

type Conn = {
  id: string;
  organization_id: string;
  provider: string;
  email_address: string;
  access_token: string;
  refresh_token: string;
  last_synced_at: string | null;
  imap_host?: string | null;
  imap_port?: number | null;
  imap_secure?: boolean | null;
  imap_password_encrypted?: string | null;
};

async function syncGmail(supabase: SbClient, conn: Conn, clientByEmail: Map<string, string>) {
  const gmail = new GmailClient(
    conn.access_token,
    conn.refresh_token,
    async (newAccess, expiresAt) => {
      await supabase
        .from("email_connections")
        .update({ access_token: newAccess, token_expires_at: expiresAt.toISOString() })
        .eq("id", conn.id);
    }
  );

  const sinceUnix = conn.last_synced_at
    ? Math.floor(new Date(conn.last_synced_at).getTime() / 1000)
    : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const query = `in:inbox after:${sinceUnix} -from:${conn.email_address}`;
  const list = await gmail.listMessages({ query, maxResults: MAX_PER_RUN });

  let processed = 0, skipped = 0, docs = 0;
  const errors: string[] = [];

  for (const ref of list.messages) {
    const exists = await alreadyProcessed(supabase, conn.id, ref.id);
    if (exists) { skipped++; continue; }

    try {
      const msg = await gmail.getMessage(ref.id);
      const sender = parseSender(getHeader(msg, "from"));
      const subject = getHeader(msg, "subject") || "(no subject)";
      const body = getGmailBody(msg);
      const receivedAt = msg.internalDate
        ? new Date(parseInt(msg.internalDate)).toISOString()
        : new Date().toISOString();
      const attList = getGmailAttachments(msg);
      const attachments = await Promise.all(
        attList.map(async (a) => ({
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
          getBuffer: async () => gmail.getAttachment(ref.id, a.attachmentId),
        }))
      );

      const r = await processEmail(supabase, conn, clientByEmail, {
        providerMessageId: ref.id,
        threadId: ref.threadId,
        sender,
        subject,
        snippet: msg.snippet || "",
        body,
        receivedAt,
        attachments,
      });
      processed++;
      docs += r.docs;
    } catch (err) {
      errors.push(`${ref.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  await touchSynced(supabase, conn.id);
  return { ok: true, processed, skipped, documents_extracted: docs, errors };
}

async function syncOutlook(supabase: SbClient, conn: Conn, clientByEmail: Map<string, string>) {
  const outlook = new OutlookClient(
    conn.access_token,
    conn.refresh_token,
    async (newAccess, newRefresh, expiresAt) => {
      await supabase
        .from("email_connections")
        .update({
          access_token: newAccess,
          refresh_token: newRefresh,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", conn.id);
    }
  );

  const sinceIso = conn.last_synced_at
    ? new Date(conn.last_synced_at).toISOString()
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const messages = await outlook.listMessages({ sinceIso, top: MAX_PER_RUN });

  let processed = 0, skipped = 0, docs = 0;
  const errors: string[] = [];

  for (const msg of messages) {
    const exists = await alreadyProcessed(supabase, conn.id, msg.id);
    if (exists) { skipped++; continue; }

    try {
      const fromAddr = msg.from?.emailAddress;
      const sender = { email: fromAddr?.address || "", name: fromAddr?.name || "" };
      const bodyText =
        msg.body?.contentType?.toLowerCase() === "html"
          ? stripHtml(msg.body.content || "")
          : msg.body?.content || "";

      const attList = msg.hasAttachments ? await outlook.listAttachments(msg.id) : [];
      const attachments = attList.map((a) => ({
        filename: a.name,
        mimeType: a.contentType,
        size: a.size,
        getBuffer: async () => outlook.getAttachmentBytes(msg.id, a.id),
      }));

      const r = await processEmail(supabase, conn, clientByEmail, {
        providerMessageId: msg.id,
        threadId: msg.conversationId,
        sender,
        subject: msg.subject,
        snippet: msg.bodyPreview,
        body: bodyText,
        receivedAt: msg.receivedDateTime,
        attachments,
      });
      processed++;
      docs += r.docs;
    } catch (err) {
      errors.push(`${msg.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  await touchSynced(supabase, conn.id);
  return { ok: true, processed, skipped, documents_extracted: docs, errors };
}

async function syncImap(supabase: SbClient, conn: Conn, clientByEmail: Map<string, string>) {
  if (!conn.imap_host || !conn.imap_port || !conn.imap_password_encrypted) {
    return { ok: false, error: "imap connection missing credentials" };
  }
  const password = decrypt(conn.imap_password_encrypted);
  const sinceDate = conn.last_synced_at
    ? new Date(conn.last_synced_at)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const messages = await fetchRecentImapMessages(
    {
      host: conn.imap_host,
      port: conn.imap_port,
      secure: conn.imap_secure !== false,
      email: conn.email_address,
      password,
    },
    { sinceDate, max: MAX_PER_RUN }
  );

  let processed = 0, skipped = 0, docs = 0;
  const errors: string[] = [];

  for (const msg of messages) {
    const messageKey = msg.messageId || `imap-${conn.id}-${msg.uid}`;
    const exists = await alreadyProcessed(supabase, conn.id, messageKey);
    if (exists) { skipped++; continue; }

    try {
      const attachments = msg.attachments.map((a) => ({
        filename: a.filename,
        mimeType: a.contentType,
        size: a.size,
        getBuffer: async () => a.content,
      }));
      const r = await processEmail(supabase, conn, clientByEmail, {
        providerMessageId: messageKey,
        threadId: null,
        sender: { email: msg.fromEmail, name: msg.fromName },
        subject: msg.subject,
        snippet: msg.bodyPreview,
        body: msg.bodyText,
        receivedAt: msg.receivedAt.toISOString(),
        attachments,
      });
      processed++;
      docs += r.docs;
    } catch (err) {
      errors.push(`${msg.uid}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  await touchSynced(supabase, conn.id);
  return { ok: true, processed, skipped, documents_extracted: docs, errors };
}

// ============================================================
// SHARED PROCESSING
// ============================================================

type ProcessInput = {
  providerMessageId: string;
  threadId: string | null;
  sender: { email: string; name: string };
  subject: string;
  snippet: string;
  body: string;
  receivedAt: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    getBuffer: () => Promise<Buffer>;
  }>;
};

async function processEmail(
  supabase: SbClient,
  conn: Conn,
  clientByEmail: Map<string, string>,
  input: ProcessInput
): Promise<{ docs: number }> {
  const matchedClientId = input.sender.email
    ? clientByEmail.get(input.sender.email.toLowerCase())
    : undefined;

  const classification = await classifyEmail({
    subject: input.subject,
    snippet: input.snippet,
    body: input.body,
    hasAttachments: input.attachments.length > 0,
    senderEmail: input.sender.email,
  });

  const { data: pe } = await supabase
    .from("processed_emails")
    .insert({
      organization_id: conn.organization_id,
      connection_id: conn.id,
      client_id: matchedClientId || null,
      provider_message_id: input.providerMessageId,
      thread_id: input.threadId,
      sender_email: input.sender.email || null,
      sender_name: input.sender.name || null,
      subject: input.subject,
      snippet: input.snippet || null,
      received_at: input.receivedAt,
      has_attachments: input.attachments.length > 0,
      attachment_count: input.attachments.length,
      ai_classification: classification.classification,
      ai_summary: classification.summary,
      ai_suggested_action: classification.suggested_action,
      status: matchedClientId ? "processed" : "needs_action",
    })
    .select()
    .single();

  let extractedHere = 0;
  for (const att of input.attachments) {
    if (!att.mimeType.startsWith("image/")) continue;
    try {
      const buffer = await att.getBuffer();
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
      }
    } catch {
      // swallow per-attachment errors; processing continues
    }
  }

  if (extractedHere > 0 && pe) {
    await supabase
      .from("processed_emails")
      .update({ documents_created: extractedHere })
      .eq("id", pe.id);
  }

  return { docs: extractedHere };
}

async function alreadyProcessed(
  supabase: SbClient,
  connectionId: string,
  providerMessageId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("processed_emails")
    .select("id")
    .eq("connection_id", connectionId)
    .eq("provider_message_id", providerMessageId)
    .maybeSingle();
  return !!data;
}

async function touchSynced(supabase: SbClient, id: string) {
  await supabase
    .from("email_connections")
    .update({ last_synced_at: new Date().toISOString(), status: "active" })
    .eq("id", id);
}
