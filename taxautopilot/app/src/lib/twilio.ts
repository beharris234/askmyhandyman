import { createHmac, timingSafeEqual } from "crypto";

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

export type TwilioCredentials = {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
};

export type SendSmsResult = {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  date_created: string;
};

export async function testTwilioCredentials(
  creds: TwilioCredentials
): Promise<{ ok: boolean; error?: string; friendlyName?: string }> {
  try {
    const res = await fetch(`${TWILIO_API_BASE}/Accounts/${creds.accountSid}.json`, {
      headers: { authorization: basicAuth(creds.accountSid, creds.authToken) },
    });
    if (!res.ok) {
      return { ok: false, error: `Twilio rejected credentials (${res.status})` };
    }
    const account = await res.json();
    return { ok: true, friendlyName: account.friendly_name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "connection failed" };
  }
}

export async function sendSms(
  creds: TwilioCredentials,
  toPhone: string,
  body: string
): Promise<SendSmsResult> {
  const res = await fetch(
    `${TWILIO_API_BASE}/Accounts/${creds.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: basicAuth(creds.accountSid, creds.authToken),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: creds.phoneNumber,
        To: toPhone,
        Body: body,
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio send failed (${res.status}): ${errText}`);
  }
  return await res.json();
}

/**
 * Validate a Twilio webhook request signature.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  // Sort params alphabetically by key, then concatenate key+value
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const computed = createHmac("sha1", authToken).update(data).digest("base64");

  if (computed.length !== signatureHeader.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader));
}

/**
 * Normalize a US phone number to E.164 format (+15551234567).
 * Returns null if it can't be parsed.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (input.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

function basicAuth(sid: string, token: string): string {
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}
