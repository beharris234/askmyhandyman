import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail, type Attachment } from "mailparser";

export type ImapCredentials = {
  host: string;
  port: number;
  secure: boolean;
  email: string;
  password: string;
};

export type ImapPreset = {
  id: string;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  notes: string;
};

export const IMAP_PRESETS: ImapPreset[] = [
  {
    id: "gmail",
    label: "Gmail / Google Workspace",
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    notes: "Requires an App Password if you have 2FA on. Create one at https://myaccount.google.com/apppasswords.",
  },
  {
    id: "outlook",
    label: "Outlook.com / Hotmail / Microsoft 365",
    host: "outlook.office365.com",
    port: 993,
    secure: true,
    notes: "Requires an App Password if you have 2FA. Microsoft 365 work accounts may need IMAP enabled by your admin.",
  },
  {
    id: "yahoo",
    label: "Yahoo Mail",
    host: "imap.mail.yahoo.com",
    port: 993,
    secure: true,
    notes: "Requires an App Password from your Yahoo Account Security settings.",
  },
  {
    id: "icloud",
    label: "iCloud Mail",
    host: "imap.mail.me.com",
    port: 993,
    secure: true,
    notes: "Requires an App-Specific Password from appleid.apple.com.",
  },
  {
    id: "aol",
    label: "AOL Mail",
    host: "imap.aol.com",
    port: 993,
    secure: true,
    notes: "Requires an App Password from your AOL Account Security.",
  },
  {
    id: "godaddy",
    label: "GoDaddy / Workspace Email",
    host: "imap.secureserver.net",
    port: 993,
    secure: true,
    notes: "Use your normal mailbox password.",
  },
  {
    id: "comcast",
    label: "Comcast Xfinity",
    host: "imap.comcast.net",
    port: 993,
    secure: true,
    notes: "Use your normal Xfinity password.",
  },
  {
    id: "custom",
    label: "Custom / Other Provider",
    host: "",
    port: 993,
    secure: true,
    notes: "Get your IMAP server, port, and security setting from your email host's documentation.",
  },
];

export type ParsedImapMessage = {
  uid: number;
  messageId?: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  receivedAt: Date;
  bodyText: string;
  bodyPreview: string;
  attachments: ImapAttachment[];
};

export type ImapAttachment = {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
};

export async function testImapConnection(creds: ImapCredentials): Promise<{ ok: boolean; error?: string }> {
  const client = newClient(creds);
  try {
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "connection failed" };
  }
}

export async function fetchRecentImapMessages(
  creds: ImapCredentials,
  opts: { sinceDate?: Date; max?: number } = {}
): Promise<ParsedImapMessage[]> {
  const client = newClient(creds);
  const messages: ParsedImapMessage[] = [];
  const max = opts.max ?? 25;
  const sinceDate = opts.sinceDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const range = await client.search({ since: sinceDate }, { uid: true });
      if (!range || range.length === 0) return [];
      const uids = range.slice(-max);

      for await (const msg of client.fetch(uids, { uid: true, source: true }, { uid: true })) {
        if (!msg.source) continue;
        const parsed: ParsedMail = await simpleParser(msg.source as Buffer);
        const fromAddr = parsed.from?.value?.[0];
        const attachments: ImapAttachment[] = (parsed.attachments || [])
          .filter((a: Attachment) => isExtractableMime(a.contentType))
          .map((a: Attachment) => ({
            filename: a.filename || "attachment",
            contentType: a.contentType,
            size: a.size || 0,
            content: a.content as Buffer,
          }));
        messages.push({
          uid: msg.uid,
          messageId: parsed.messageId,
          subject: parsed.subject || "(no subject)",
          fromEmail: fromAddr?.address || "",
          fromName: fromAddr?.name || "",
          receivedAt: parsed.date || new Date(),
          bodyText: (parsed.text || "").slice(0, 5000),
          bodyPreview: (parsed.text || parsed.html || "").toString().slice(0, 200),
          attachments,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return messages;
}

function newClient(creds: ImapCredentials): ImapFlow {
  return new ImapFlow({
    host: creds.host,
    port: creds.port,
    secure: creds.secure,
    auth: { user: creds.email, pass: creds.password },
    logger: false,
  });
}

function isExtractableMime(mime: string): boolean {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ].includes((mime || "").toLowerCase());
}
