import { refreshMicrosoftToken } from "./microsoft-oauth";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export type OutlookAttachment = {
  id: string;
  name: string;
  contentType: string;
  size: number;
};

export type OutlookMessage = {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body?: { contentType?: string; content?: string };
  from?: { emailAddress: { name?: string; address: string } };
  receivedDateTime: string;
  hasAttachments: boolean;
};

export class OutlookClient {
  constructor(
    private accessToken: string,
    private refreshToken: string,
    private onTokenRefresh?: (newAccess: string, newRefresh: string, expiresAt: Date) => Promise<void>
  ) {}

  private async fetch(path: string, init?: RequestInit): Promise<Response> {
    let res = await fetch(`${GRAPH_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        authorization: `Bearer ${this.accessToken}`,
      },
    });
    if (res.status === 401) {
      const refreshed = await refreshMicrosoftToken(this.refreshToken);
      this.accessToken = refreshed.access_token;
      if (refreshed.refresh_token) this.refreshToken = refreshed.refresh_token;
      if (this.onTokenRefresh) {
        const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
        await this.onTokenRefresh(this.accessToken, this.refreshToken, expiresAt);
      }
      res = await fetch(`${GRAPH_BASE}${path}`, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          authorization: `Bearer ${this.accessToken}`,
        },
      });
    }
    return res;
  }

  async listMessages(opts: { sinceIso?: string; top?: number } = {}): Promise<OutlookMessage[]> {
    const params = new URLSearchParams();
    params.set("$top", String(opts.top ?? 25));
    params.set(
      "$select",
      "id,conversationId,subject,bodyPreview,body,from,receivedDateTime,hasAttachments"
    );
    params.set("$orderby", "receivedDateTime desc");
    if (opts.sinceIso) {
      params.set("$filter", `receivedDateTime ge ${opts.sinceIso}`);
    }
    const res = await this.fetch(`/me/mailFolders/Inbox/messages?${params.toString()}`);
    if (!res.ok) throw new Error(`Graph list failed: ${await res.text()}`);
    const data = await res.json();
    return data.value || [];
  }

  async listAttachments(messageId: string): Promise<OutlookAttachment[]> {
    const res = await this.fetch(
      `/me/messages/${messageId}/attachments?$select=id,name,contentType,size`
    );
    if (!res.ok) throw new Error(`Graph attachments list failed: ${await res.text()}`);
    const data = await res.json();
    return (data.value || []).filter((a: OutlookAttachment) =>
      isExtractableMime(a.contentType)
    );
  }

  async getAttachmentBytes(messageId: string, attachmentId: string): Promise<Buffer> {
    const res = await this.fetch(`/me/messages/${messageId}/attachments/${attachmentId}/$value`);
    if (!res.ok) throw new Error(`Graph attachment fetch failed: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }
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

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
