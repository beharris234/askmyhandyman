import nodemailer from "nodemailer";
import { refreshAccessToken } from "./google-oauth";
import { refreshMicrosoftToken } from "./microsoft-oauth";
import { decrypt } from "./encryption";

export type EmailConnection = {
  id: string;
  provider: "gmail" | "outlook" | "imap";
  email_address: string;
  access_token: string;
  refresh_token: string;
  // IMAP/SMTP
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_secure?: boolean | null;
  imap_password_encrypted?: string | null;
};

export type SendEmailInput = {
  toAddress: string;
  subject: string;
  bodyText: string;
  /** RFC822 Message-ID of the email we're replying to (used for threading). */
  inReplyToMessageId?: string;
  /** External provider ID of original message (Gmail: id, Outlook: id) — used to find the thread on the provider side. */
  providerOriginalMessageId?: string;
  /** Gmail-specific: the thread ID to reply within. */
  gmailThreadId?: string;
};

export type SendEmailResult = {
  externalMessageId: string;
  threadId?: string | null;
};

export type TokenRefreshHook = (
  newAccess: string,
  newRefresh: string | null,
  expiresAt: Date
) => Promise<void>;

export async function sendEmail(
  conn: EmailConnection,
  input: SendEmailInput,
  onTokenRefresh?: TokenRefreshHook
): Promise<SendEmailResult> {
  if (conn.provider === "gmail") return sendViaGmail(conn, input, onTokenRefresh);
  if (conn.provider === "outlook") return sendViaOutlook(conn, input, onTokenRefresh);
  if (conn.provider === "imap") return sendViaSmtp(conn, input);
  throw new Error(`Unknown provider: ${conn.provider}`);
}

// ============================================================
// GMAIL
// ============================================================

async function sendViaGmail(
  conn: EmailConnection,
  input: SendEmailInput,
  onTokenRefresh?: TokenRefreshHook
): Promise<SendEmailResult> {
  const rfc822 = buildRfc822Message({
    from: conn.email_address,
    to: input.toAddress,
    subject: input.subject,
    bodyText: input.bodyText,
    inReplyToMessageId: input.inReplyToMessageId,
  });

  const raw = Buffer.from(rfc822).toString("base64url");
  const url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
  const payload: { raw: string; threadId?: string } = { raw };
  if (input.gmailThreadId) payload.threadId = input.gmailThreadId;

  let res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${conn.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken(conn.refresh_token);
    conn.access_token = refreshed.access_token;
    if (onTokenRefresh) {
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      await onTokenRefresh(refreshed.access_token, null, expiresAt);
    }
    res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${conn.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 403 && errText.includes("insufficient")) {
      throw new Error(
        "Gmail returned 403: this connection doesn't have gmail.send scope. Reconnect Gmail to grant send permission."
      );
    }
    throw new Error(`Gmail send failed (${res.status}): ${errText}`);
  }

  const result = await res.json();
  return { externalMessageId: result.id, threadId: result.threadId };
}

// ============================================================
// OUTLOOK / MICROSOFT 365
// ============================================================

async function sendViaOutlook(
  conn: EmailConnection,
  input: SendEmailInput,
  onTokenRefresh?: TokenRefreshHook
): Promise<SendEmailResult> {
  // If we have the original message ID, use createReply for proper threading
  if (input.providerOriginalMessageId) {
    const ok = await sendOutlookReply(conn, input.providerOriginalMessageId, input.bodyText, onTokenRefresh);
    if (ok) return { externalMessageId: `outlook-reply-${input.providerOriginalMessageId}`, threadId: null };
  }
  // Fallback: standalone sendMail
  return sendOutlookStandalone(conn, input, onTokenRefresh);
}

async function sendOutlookReply(
  conn: EmailConnection,
  originalId: string,
  bodyText: string,
  onTokenRefresh?: TokenRefreshHook
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/me/messages/${originalId}/reply`;
  const body = JSON.stringify({
    comment: bodyText,
  });

  let res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${conn.access_token}`,
      "content-type": "application/json",
    },
    body,
  });

  if (res.status === 401) {
    const refreshed = await refreshMicrosoftToken(conn.refresh_token);
    conn.access_token = refreshed.access_token;
    if (refreshed.refresh_token) conn.refresh_token = refreshed.refresh_token;
    if (onTokenRefresh) {
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      await onTokenRefresh(refreshed.access_token, refreshed.refresh_token || null, expiresAt);
    }
    res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${conn.access_token}`,
        "content-type": "application/json",
      },
      body,
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 403) {
      throw new Error(
        "Outlook returned 403: this connection doesn't have Mail.Send. Reconnect Outlook to grant send permission."
      );
    }
    throw new Error(`Outlook reply failed (${res.status}): ${errText}`);
  }
  return true;
}

async function sendOutlookStandalone(
  conn: EmailConnection,
  input: SendEmailInput,
  onTokenRefresh?: TokenRefreshHook
): Promise<SendEmailResult> {
  const url = "https://graph.microsoft.com/v1.0/me/sendMail";
  const body = JSON.stringify({
    message: {
      subject: input.subject,
      body: { contentType: "Text", content: input.bodyText },
      toRecipients: [{ emailAddress: { address: input.toAddress } }],
    },
    saveToSentItems: true,
  });

  let res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${conn.access_token}`,
      "content-type": "application/json",
    },
    body,
  });

  if (res.status === 401) {
    const refreshed = await refreshMicrosoftToken(conn.refresh_token);
    conn.access_token = refreshed.access_token;
    if (onTokenRefresh) {
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      await onTokenRefresh(refreshed.access_token, refreshed.refresh_token || null, expiresAt);
    }
    res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${conn.access_token}`,
        "content-type": "application/json",
      },
      body,
    });
  }

  if (!res.ok) throw new Error(`Outlook sendMail failed (${res.status}): ${await res.text()}`);
  return { externalMessageId: `outlook-standalone-${Date.now()}`, threadId: null };
}

// ============================================================
// SMTP (for IMAP-connected accounts)
// ============================================================

async function sendViaSmtp(
  conn: EmailConnection,
  input: SendEmailInput
): Promise<SendEmailResult> {
  if (!conn.smtp_host || !conn.smtp_port || !conn.imap_password_encrypted) {
    throw new Error(
      "SMTP not configured for this IMAP connection. Add SMTP server/port in settings."
    );
  }
  const password = decrypt(conn.imap_password_encrypted);

  const transporter = nodemailer.createTransport({
    host: conn.smtp_host,
    port: conn.smtp_port,
    secure: conn.smtp_port === 465,
    auth: { user: conn.email_address, pass: password },
  });

  const headers: Record<string, string> = {};
  if (input.inReplyToMessageId) {
    headers["In-Reply-To"] = `<${input.inReplyToMessageId}>`;
    headers["References"] = `<${input.inReplyToMessageId}>`;
  }

  const info = await transporter.sendMail({
    from: conn.email_address,
    to: input.toAddress,
    subject: input.subject,
    text: input.bodyText,
    headers,
  });

  return { externalMessageId: info.messageId || `smtp-${Date.now()}`, threadId: null };
}

// ============================================================
// HELPERS
// ============================================================

function buildRfc822Message(opts: {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  inReplyToMessageId?: string;
}): string {
  const lines: string[] = [];
  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  lines.push(`Subject: ${opts.subject}`);
  if (opts.inReplyToMessageId) {
    lines.push(`In-Reply-To: <${opts.inReplyToMessageId}>`);
    lines.push(`References: <${opts.inReplyToMessageId}>`);
  }
  lines.push("MIME-Version: 1.0");
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push("Content-Transfer-Encoding: 7bit");
  lines.push("");
  lines.push(opts.bodyText);
  return lines.join("\r\n");
}

/**
 * Common SMTP defaults derived from IMAP host. Used to auto-fill the
 * SMTP fields when an IMAP connection is first created.
 */
export function smtpDefaultsForImapHost(
  imapHost: string
): { host: string; port: number; secure: boolean } | null {
  const h = imapHost.toLowerCase();
  if (h.includes("gmail")) return { host: "smtp.gmail.com", port: 587, secure: false };
  if (h.includes("outlook") || h.includes("office365"))
    return { host: "smtp-mail.outlook.com", port: 587, secure: false };
  if (h.includes("yahoo")) return { host: "smtp.mail.yahoo.com", port: 465, secure: true };
  if (h.includes("me.com") || h.includes("icloud"))
    return { host: "smtp.mail.me.com", port: 587, secure: false };
  if (h.includes("aol")) return { host: "smtp.aol.com", port: 587, secure: false };
  if (h.includes("secureserver")) return { host: "smtpout.secureserver.net", port: 465, secure: true };
  if (h.includes("comcast")) return { host: "smtp.comcast.net", port: 587, secure: false };
  return null;
}
