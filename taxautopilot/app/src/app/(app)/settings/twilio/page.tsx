import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TwilioConnectForm } from "./TwilioConnectForm";

export default async function TwilioSettingsPage() {
  const supabase = await createClient();

  const { data: twilioNum } = await supabase
    .from("twilio_numbers")
    .select("id, phone_number, friendly_name, status, created_at")
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/twilio/sms-incoming`;

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to settings
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">📱</div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--navy-900)]">Twilio SMS</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Connect your Twilio number so AI can text clients on your behalf.
            </p>
          </div>
        </div>

        {twilioNum ? (
          <div className="rounded-xl bg-[var(--green-100)] border border-[var(--green-500)]/30 p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-bold text-[var(--navy-900)]">
                  ✓ Connected: {twilioNum.phone_number}
                </div>
                {twilioNum.friendly_name && (
                  <div className="text-xs text-[var(--text-muted)]">{twilioNum.friendly_name}</div>
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[var(--green-500)] text-white">
                {twilioNum.status}
              </span>
            </div>
          </div>
        ) : (
          <TwilioConnectForm />
        )}

        {/* Webhook URL section */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="font-bold text-[var(--navy-900)] mb-2">Set up the incoming SMS webhook</h3>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            In your Twilio Console, set this URL as the &ldquo;A message comes in&rdquo; webhook for your phone number:
          </p>
          <div className="bg-slate-900 text-green-400 font-mono text-xs p-3 rounded-lg break-all">
            POST {webhookUrl}
          </div>
          <ol className="mt-4 space-y-1.5 text-xs text-[var(--text-muted)] list-decimal list-inside">
            <li>Console → Phone Numbers → Manage → Active numbers</li>
            <li>Click your number → scroll to &ldquo;Messaging configuration&rdquo;</li>
            <li>Webhook URL: paste the URL above (HTTP POST)</li>
            <li>Save. Test by texting your number — it should appear in /messages.</li>
          </ol>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-[var(--text-muted)] space-y-1.5">
          <div>
            🔐 Your Auth Token is encrypted (AES-256-GCM) before storage. It&apos;s only
            decrypted in memory at send-time.
          </div>
          <div>
            ✋ Don&apos;t have Twilio yet?{" "}
            <a
              href="https://www.twilio.com/try-twilio"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--green-600)] font-semibold hover:underline"
            >
              Sign up free
            </a>
            {" "}— numbers are ~$1/month, texts ~$0.0079 each.
          </div>
        </div>
      </div>
    </div>
  );
}
