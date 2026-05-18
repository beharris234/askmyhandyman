const MS_TENANT = "common";
const MS_AUTH_ENDPOINT = `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize`;
const MS_TOKEN_ENDPOINT = `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`;
const MS_GRAPH_USERINFO = "https://graph.microsoft.com/v1.0/me";

export const OUTLOOK_SCOPES = [
  "offline_access",
  "User.Read",
  "Mail.Read",
  "Mail.ReadWrite",
];

export function getMicrosoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("MICROSOFT_CLIENT_ID"),
    response_type: "code",
    redirect_uri: getRedirectUri(),
    response_mode: "query",
    scope: OUTLOOK_SCOPES.join(" "),
    state,
    prompt: "select_account",
  });
  return `${MS_AUTH_ENDPOINT}?${params.toString()}`;
}

export type MicrosoftTokens = {
  token_type: string;
  scope: string;
  expires_in: number;
  ext_expires_in?: number;
  access_token: string;
  refresh_token: string;
  id_token?: string;
};

export async function exchangeMicrosoftCode(code: string): Promise<MicrosoftTokens> {
  const res = await fetch(MS_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("MICROSOFT_CLIENT_ID"),
      client_secret: requireEnv("MICROSOFT_CLIENT_SECRET"),
      code,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
      scope: OUTLOOK_SCOPES.join(" "),
    }),
  });
  if (!res.ok) {
    throw new Error(`Microsoft token exchange failed (${res.status}): ${await res.text()}`);
  }
  return await res.json();
}

export async function refreshMicrosoftToken(
  refreshToken: string
): Promise<Pick<MicrosoftTokens, "access_token" | "refresh_token" | "expires_in">> {
  const res = await fetch(MS_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("MICROSOFT_CLIENT_ID"),
      client_secret: requireEnv("MICROSOFT_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: OUTLOOK_SCOPES.join(" "),
    }),
  });
  if (!res.ok) {
    throw new Error(`Microsoft token refresh failed (${res.status}): ${await res.text()}`);
  }
  return await res.json();
}

export type MicrosoftUserInfo = {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
};

export async function getMicrosoftUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
  const res = await fetch(MS_GRAPH_USERINFO, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Microsoft userinfo failed: ${await res.text()}`);
  return await res.json();
}

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/microsoft/callback`;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}
