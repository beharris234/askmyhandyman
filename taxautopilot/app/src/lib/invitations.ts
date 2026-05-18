import { randomBytes } from "crypto";

/** Generate a URL-safe invite token (32 bytes → 43 chars base64url). */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Build the accept-invite URL for an email or share. */
export function buildInviteUrl(token: string, appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}/accept-invite?token=${encodeURIComponent(token)}`;
}

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  preparer: "Preparer",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full access. Manages billing, team, and all settings.",
  admin: "Manages team and settings. No billing access.",
  preparer: "Handles assigned clients. Sees their own work.",
};
