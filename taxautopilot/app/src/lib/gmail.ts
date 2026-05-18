import { refreshAccessToken } from "./google-oauth";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GmailMessageHeader = { name: string; value: string };

export type GmailMessagePart = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  body?: { size?: number; data?: string; attachmentId?: string };
  parts?: GmailMessagePart[];
};

export type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
};

export class GmailClient {
  constructor(
    private accessToken: string,
    private refreshToken: string,
    private onTokenRefresh?: (newAccess: string, expiresAt: Date) => Promise<void>
  ) {}

  private async fetch(path: string, init?: RequestInit): Promise<Response> {
    let res = await fetch(`${GMAIL_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        authorization: `Bearer ${this.accessToken}`,
      },
    });
    if (res.status === 401) {
      const refreshed = await refreshAccessToken(this.refreshToken);
      this.accessToken = refreshed.access_token;
      if (this.onTokenRefresh) {
        const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
        await this.onTokenRefresh(this.accessToken, expiresAt);
      }
      res = await fetch(`${GMAIL_BASE}${path}`, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          authorization: `Bearer ${this.accessToken}`,
        },
      });
    }
    return res;
  }

  async listMessages(opts: { query?: string; maxResults?: number; pageToken?: string } = {}): Promise<{
    messages: { id: string; threadId: string }[];
    nextPageToken?: string;
  }> {
    const params = new URLSearchParams();
    if (opts.query) params.set("q", opts.query);
    if (opts.maxResults) params.set("maxResults", String(opts.maxResults));
    if (opts.pageToken) params.set("pageToken", opts.pageToken);
    const res = await this.fetch(`/messages?${params.toString()}`);
    if (!res.ok) throw new Error(`Gmail list failed: ${await res.text()}`);
    const data = await res.json();
    return { messages: data.messages || [], nextPageToken: data.nextPageToken };
  }

  async getMessage(id: string): Promise<GmailMessage> {
    const res = await this.fetch(`/messages/${id}?format=full`);
    if (!res.ok) throw new Error(`Gmail get failed: ${await res.text()}`);
    return await res.json();
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    const res = await this.fetch(`/messages/${messageId}/attachments/${attachmentId}`);
    if (!res.ok) throw new Error(`Gmail attachment fetch failed: ${await res.text()}`);
    const data = await res.json();
    return Buffer.from(data.data, "base64url");
  }
}

// === Helpers to flatten Gmail's nested message format ===

export function getHeader(message: GmailMessage, name: string): string | undefined {
  return message.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value;
}

export function parseSender(fromHeader: string | undefined): { email: string; name: string } {
  if (!fromHeader) return { email: "", name: "" };
  const match = fromHeader.match(/^\s*(?:"?([^"<]+?)"?\s*)?<?([^>\s]+@[^>\s]+)>?\s*$/);
  if (!match) return { email: fromHeader.trim(), name: "" };
  return { name: (match[1] || "").trim(), email: (match[2] || "").trim() };
}

export type GmailAttachment = {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
};

export function getAttachments(message: GmailMessage): GmailAttachment[] {
  const attachments: GmailAttachment[] = [];
  function walk(part: GmailMessagePart | undefined) {
    if (!part) return;
    if (
      part.filename &&
      part.body?.attachmentId &&
      part.mimeType &&
      isExtractableMime(part.mimeType)
    ) {
      attachments.push({
        attachmentId: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0,
      });
    }
    if (part.parts) part.parts.forEach(walk);
  }
  walk(message.payload);
  return attachments;
}

function isExtractableMime(mime: string): boolean {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ].includes(mime.toLowerCase());
}

export function getBodyText(message: GmailMessage): string {
  let text = "";
  function walk(part: GmailMessagePart | undefined) {
    if (!part) return;
    if (part.mimeType === "text/plain" && part.body?.data) {
      text += Buffer.from(part.body.data, "base64url").toString("utf-8") + "\n";
    } else if (part.parts) {
      part.parts.forEach(walk);
    }
  }
  walk(message.payload);
  return text.trim();
}
