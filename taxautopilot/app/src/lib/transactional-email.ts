import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY is not set. Sign up at resend.com (free up to 3,000 emails/mo) and add the key to .env.local."
      );
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getFromAddress(): string {
  // Default to Resend's test address until you verify your own domain
  return process.env.RESEND_FROM_EMAIL || "TaxAutopilot <onboarding@resend.dev>";
}

export type EmailSendInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendTransactional(input: EmailSendInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isEmailConfigured()) {
    console.warn("[email] skipped — RESEND_API_KEY not set:", input.subject);
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true, id: result.data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}

// ============================================================
// TEMPLATES
// ============================================================

export function inviteEmailTemplate(opts: {
  inviteUrl: string;
  officeName: string;
  inviterName: string;
  role: string;
}) {
  return {
    subject: `${opts.inviterName} invited you to join ${opts.officeName} on TaxAutopilot`,
    html: wrap(`
      <h1 style="margin:0 0 16px;color:#0A1628;font-size:24px;">You're invited 🎉</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">
        <strong style="color:#0A1628;">${escapeHtml(opts.inviterName)}</strong> invited you to join
        <strong style="color:#0A1628;">${escapeHtml(opts.officeName)}</strong> as a
        <strong style="color:#10B981;">${escapeHtml(opts.role)}</strong> on TaxAutopilot — the AI office manager for tax pros.
      </p>
      <div style="margin:28px 0;text-align:center;">
        <a href="${opts.inviteUrl}" style="display:inline-block;background:#0A1628;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
          Accept Invitation →
        </a>
      </div>
      <p style="color:#94A3B8;font-size:13px;line-height:1.6;">
        Or copy this link into your browser:<br>
        <code style="color:#475569;word-break:break-all;font-size:11px;">${opts.inviteUrl}</code>
      </p>
      <p style="color:#94A3B8;font-size:12px;margin-top:24px;">This invitation expires in 14 days.</p>
    `),
  };
}

export function welcomeEmailTemplate(opts: {
  fullName: string;
  officeName: string;
  referralCode: string;
  referralUrl: string;
  appUrl: string;
}) {
  return {
    subject: `Welcome to TaxAutopilot, ${opts.fullName.split(" ")[0]}!`,
    html: wrap(`
      <h1 style="margin:0 0 16px;color:#0A1628;font-size:24px;">Welcome aboard 🚀</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">
        Hi ${escapeHtml(opts.fullName.split(" ")[0])}, ${escapeHtml(opts.officeName)} is now on TaxAutopilot.
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.6;">
        Here's how to get the most out of your first week:
      </p>
      <ol style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;">
        <li><strong>Import your client list</strong> from your tax software (CSV upload in Clients)</li>
        <li><strong>Connect an inbox</strong> in Settings (Gmail, Outlook, or any email)</li>
        <li><strong>Try the document extractor</strong> on a real W-2 — see the AI work</li>
        <li><strong>Invite your team</strong> if you have preparers (each gets their own dashboard)</li>
      </ol>
      <div style="margin:28px 0;padding:20px;background:linear-gradient(135deg,#D1FAE5,#FDE68A);border-radius:14px;">
        <div style="font-size:12px;font-weight:700;color:#92590B;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">🎁 Your Referral Code</div>
        <div style="font-family:monospace;font-size:20px;font-weight:800;color:#0A1628;margin-bottom:8px;">${escapeHtml(opts.referralCode)}</div>
        <div style="font-size:13px;color:#0A1628;">
          Share your link and earn <strong>$250 credit</strong> for every tax office that signs up. Refer 10 = your next year is <strong>free</strong>.
        </div>
        <div style="margin-top:10px;font-size:11px;color:#475569;word-break:break-all;font-family:monospace;">${opts.referralUrl}</div>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${opts.appUrl}/dashboard" style="display:inline-block;background:#0A1628;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
          Open Your Dashboard →
        </a>
      </div>
    `),
  };
}

export function referralEarnedEmailTemplate(opts: {
  refereeName: string;
  newBalance: number;
  referralCount: number;
  referralsToFreeYear: number;
  appUrl: string;
}) {
  return {
    subject: `🎉 ${opts.refereeName} signed up — $250 added to your account`,
    html: wrap(`
      <h1 style="margin:0 0 16px;color:#0A1628;font-size:24px;">Cha-ching 💰</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">
        <strong style="color:#0A1628;">${escapeHtml(opts.refereeName)}</strong> just signed up to TaxAutopilot using your referral link.
      </p>
      <div style="margin:24px 0;padding:24px;background:#D1FAE5;border-radius:14px;text-align:center;">
        <div style="font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1.5px;">New Balance</div>
        <div style="font-size:36px;font-weight:800;color:#059669;line-height:1;margin:6px 0;">$${opts.newBalance.toLocaleString()}</div>
        <div style="font-size:13px;color:#0A1628;">Auto-applied to your next renewal.</div>
      </div>
      <p style="color:#475569;font-size:14px;line-height:1.6;">
        ${
          opts.referralsToFreeYear === 0
            ? "🎉 You've hit 10 referrals — your next renewal is FREE."
            : `${opts.referralsToFreeYear} more qualified referral${opts.referralsToFreeYear === 1 ? "" : "s"} = full free year. Keep going.`
        }
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${opts.appUrl}/referrals" style="display:inline-block;background:#0A1628;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
          View Your Referrals →
        </a>
      </div>
    `),
  };
}

// ============================================================
// HTML HELPERS
// ============================================================

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:#0A1628;font-size:18px;letter-spacing:-0.5px;">
        TaxAutopilot
      </div>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
      ${content}
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:11px;">
      The AI Office Manager for Tax Pros
    </div>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
